const { test } = require('node:test');
const assert = require('node:assert/strict');
const { serviceHarness } = require('./helpers.cjs');

const assigned = (status = 'ASSIGNED') => ({
  driverId: 'driver-1', driverName: 'Test Driver', buyerId: 'buyer-1',
  status, driverPhone: '0770000000', driverVehicle: 'WP-1234',
  statusHistory: [{ status: 'PENDING' }], assignmentHistory: [{ action: 'INITIAL_ASSIGNMENT' }],
});
const fleet = () => ({
  'users/driver-1': {},
  'vehicles/lorry': { driverUid: 'driver-1', plateNumber: 'WP-1234', isActive: false },
  'vehicles/van': { driverUid: 'driver-1', plateNumber: 'WP-5678', isActive: false },
  'vehicles/other': { driverUid: 'driver-2', plateNumber: 'OTHER', isActive: true },
});

test('accepting an assignment preserves ownership and previous history', async () => {
  const h = serviceHarness({ 'orders/order-1': assigned() });
  assert.equal((await h.api.acceptDriverDelivery('order-1', 'driver-1')).success, true);
  const saved = h.records.get('orders/order-1');
  assert.equal(saved.status, 'ACCEPTED');
  assert.equal(saved.driverId, 'driver-1');
  assert.equal(saved.buyerId, 'buyer-1');
  assert.equal(saved.statusHistory.length, 2);
  assert.equal(saved.statusHistory[1].actorRole, 'driver');
  assert.equal(saved.acceptedAt, 'SERVER_TIMESTAMP');
  assert.ok(Number.isFinite(Date.parse(saved.acceptedIso)));
});

for (const status of ['ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']) {
  test(`acceptance rejects ${status} without writing`, async () => {
    const h = serviceHarness({ 'orders/order-1': assigned(status) });
    assert.equal((await h.api.acceptDriverDelivery('order-1', 'driver-1')).success, false);
    assert.equal(h.writes.length, 0);
  });
}

for (const status of ['ASSIGNED', 'ACCEPTED', 'READY_FOR_PICKUP']) {
  test(`rejecting ${status} returns the order for reassignment`, async () => {
    const h = serviceHarness({ 'orders/order-1': assigned(status) });
    assert.equal((await h.api.rejectDriverDelivery('order-1', 'driver-1')).success, true);
    const saved = h.records.get('orders/order-1');
    assert.equal(saved.status, 'READY_FOR_PICKUP');
    for (const field of ['driverId', 'driverName', 'driverPhone', 'driverVehicle', 'assignedAt']) assert.equal(saved[field], null);
    assert.equal(saved.buyerId, 'buyer-1');
    assert.equal(saved.assignmentHistory.length, 2);
    assert.equal(saved.assignmentHistory[1].action, 'DRIVER_REJECTED');
    assert.equal(saved.statusHistory.length, 2);
  });
}

for (const status of ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']) {
  test(`rejection blocks ${status} without writing`, async () => {
    const h = serviceHarness({ 'orders/order-1': assigned(status) });
    assert.equal((await h.api.rejectDriverDelivery('order-1', 'driver-1')).success, false);
    assert.equal(h.writes.length, 0);
  });
}

for (const action of ['acceptDriverDelivery', 'rejectDriverDelivery']) {
  test(`${action} rejects unauthenticated, foreign, missing and reassigned orders`, async () => {
    for (const scenario of ['signed-out', 'foreign-session', 'missing', 'reassigned', 'missing-id']) {
      const h = serviceHarness(scenario === 'missing' ? {} : { 'orders/order-1': assigned() });
      if (scenario === 'signed-out') h.auth.currentUser = null;
      if (scenario === 'foreign-session') h.auth.currentUser.uid = 'driver-2';
      if (scenario === 'reassigned') h.records.get('orders/order-1').driverId = 'driver-2';
      const result = await h.api[action](scenario === 'missing-id' ? '' : 'order-1', 'driver-1');
      assert.equal(result.success, false, scenario);
      assert.equal(h.writes.length, 0, scenario);
    }
  });
  test(`${action} reports database failures without committing`, async () => {
    const h = serviceHarness({ 'orders/order-1': assigned() }, { writeError: 'Permission denied' });
    const result = await h.api[action]('order-1', 'driver-1');
    assert.equal(result.success, false);
    assert.match(result.error, /Permission denied/);
    assert.equal(h.records.get('orders/order-1').status, 'ASSIGNED');
  });
}

test('dispatch selection supports two vehicles and independent removal', async () => {
  const h = serviceHarness(fleet());
  await h.api.setActiveDriverVehicle('driver-1', 'lorry', true);
  await h.api.setActiveDriverVehicle('driver-1', 'van', true);
  assert.equal(h.records.get('vehicles/lorry').isActive, true);
  assert.equal(h.records.get('vehicles/van').isActive, true);
  assert.deepEqual(h.records.get('users/driver-1').dispatchVehicleIds, ['lorry', 'van']);
  await h.api.setActiveDriverVehicle('driver-1', 'lorry', false);
  assert.equal(h.records.get('vehicles/van').isActive, true);
  assert.deepEqual(h.records.get('users/driver-1').dispatchVehicleIds, ['van']);
  assert.equal(h.records.get('vehicles/other').isActive, true);
});

test('removing the last selection clears cached dispatch details', async () => {
  const h = serviceHarness(fleet());
  await h.api.setActiveDriverVehicle('driver-1', 'lorry', true);
  await h.api.setActiveDriverVehicle('driver-1', 'lorry', false);
  const profile = h.records.get('users/driver-1');
  assert.deepEqual(profile.dispatchVehicleIds, []);
  assert.equal(profile.vehicle, null);
  assert.equal(profile.vehicleNumber, '');
});

test('selection rejects foreign vehicles and invalid flags', async () => {
  for (const [id, active] of [['other', true], ['missing', true], ['lorry', 'yes']]) {
    const h = serviceHarness(fleet());
    assert.equal((await h.api.setActiveDriverVehicle('driver-1', id, active)).success, false);
    assert.equal(h.writes.length, 0);
  }
});

test('failed dispatch save preserves vehicle and profile state', async () => {
  const h = serviceHarness(fleet(), { writeError: 'Permission denied' });
  assert.equal((await h.api.setActiveDriverVehicle('driver-1', 'lorry', true)).success, false);
  assert.equal(h.records.get('vehicles/lorry').isActive, false);
  assert.equal(h.writes.length, 0);
});

test('deleting a selected vehicle preserves other dispatch selections', async () => {
  const h = serviceHarness(fleet());
  await h.api.setActiveDriverVehicle('driver-1', 'lorry', true);
  await h.api.setActiveDriverVehicle('driver-1', 'van', true);
  assert.equal((await h.api.deleteDriverVehicle('lorry', 'driver-1')).success, true);
  assert.equal(h.records.has('vehicles/lorry'), false);
  assert.deepEqual(h.records.get('users/driver-1').dispatchVehicleIds, ['van']);
  assert.equal(h.records.get('users/driver-1').vehicleNumber, 'WP-5678');
});

test('deleting a foreign vehicle is rejected', async () => {
  const h = serviceHarness(fleet());
  assert.equal((await h.api.deleteDriverVehicle('other', 'driver-1')).success, false);
  assert.equal(h.records.has('vehicles/other'), true);
  assert.equal(h.writes.length, 0);
});

test('vehicle registration uploads selected image data and saves a hosted URL', async () => {
  const h = serviceHarness();
  const result = await h.api.addDriverVehicle('driver-1', { plateNumber: 'WP-1234', image: 'data:image/jpeg;base64,/9j/AAAA' });
  assert.equal(result.success, true);
  assert.equal(h.uploads.length, 1);
  const saved = h.records.get('vehicles/new-vehicle');
  assert.equal(saved.image, 'https://example.test/vehicle.jpg');
  assert.equal(saved.driverUid, 'driver-1');
  assert.equal(saved.isActive, false);
});

test('vehicle edits preserve dispatch selection and avoid re-uploading hosted images', async () => {
  const h = serviceHarness(fleet());
  h.records.get('vehicles/lorry').isActive = true;
  const result = await h.api.updateDriverVehicle('lorry', { capacity: 2500, image: 'https://example.test/lorry.jpg' }, 'driver-1');
  assert.equal(result.success, true);
  assert.equal(h.records.get('vehicles/lorry').capacity, 2500);
  assert.equal(h.records.get('vehicles/lorry').isActive, true);
  assert.equal(h.uploads.length, 0);
});

test('failed registration returns an error instead of reporting success', async () => {
  const h = serviceHarness({}, { writeError: 'Permission denied' });
  const result = await h.api.addDriverVehicle('driver-1', { image: 'https://example.test/photo.jpg' });
  assert.equal(result.success, false);
  assert.equal(h.writes.length, 0);
});
