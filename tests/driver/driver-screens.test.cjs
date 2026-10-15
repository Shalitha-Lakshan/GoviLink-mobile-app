const { test } = require('node:test');
const assert = require('node:assert/strict');
const { screenHarness, elements, text, find, button } = require('./helpers.cjs');

const profile = { uid: 'driver-1', role: 'driver', fullName: 'Test Driver', photoURL: 'https://example.test/me.jpg' };
const orders = [
  { id: 'new', driverId: 'driver-1', status: 'ASSIGNED', produceName: 'Carrots' },
  { id: 'moving', driverId: 'driver-1', status: 'IN_TRANSIT', produceName: 'Beans' },
  { id: 'done', driverId: 'driver-1', status: 'DELIVERED', produceName: 'Rice' },
  { id: 'foreign', driverId: 'driver-2', status: 'ASSIGNED', produceName: 'Foreign crop' },
];
const tab = (tree, label) => find(tree, (node) => node.props.accessibilityRole === 'tab' && node.props.accessibilityLabel === label);

test('driver overview hides other drivers orders and opens the moving route', () => {
  const h = screenHarness('DriverHomeScreen.js', { userProfile: profile, ordersList: orders });
  let tree = h.render();
  assert.ok(!text(tree).includes('Foreign crop'));
  assert.ok(text(tree).includes('Carrots'));
  button(tree, 'View route & tracking details').props.onPress();
  tree = h.render();
  const tracking = find(tree, (node) => node.type === 'Tracking');
  assert.equal(tracking.props.delivery.id, 'moving');
  tracking.props.onBack();
  assert.ok(find(h.render(), (node) => node.type === 'Heading'));
  h.cleanup();
});

test('completed filter shows completed jobs and their route details', () => {
  const h = screenHarness('DriverHomeScreen.js', { userProfile: profile, ordersList: orders });
  tab(h.render(), 'My deliveries').props.onPress();
  button(h.render(), 'Completed (1)').props.onPress();
  const tree = h.render();
  assert.ok(text(tree).includes('Rice'));
  assert.ok(!text(tree).includes('Carrots'));
  button(tree, 'View route & tracking details').props.onPress();
  assert.equal(find(h.render(), (node) => node.type === 'Tracking').props.delivery.id, 'done');
  h.cleanup();
});

test('empty assignments show an explanatory empty state', () => {
  const h = screenHarness('DriverHomeScreen.js', { userProfile: profile, ordersList: [] });
  assert.ok(text(h.render()).includes('No active deliveries'));
  h.cleanup();
});

test('fleet navigation opens the vehicle form and returns to the fleet', () => {
  const h = screenHarness('DriverHomeScreen.js', { userProfile: profile });
  tab(h.render(), 'My Fleet').props.onPress();
  find(h.render(), (node) => node.type === 'Fleet').props.onAddNewVehicle();
  find(h.render(), (node) => node.type === 'AddVehicle').props.onBack();
  assert.ok(find(h.render(), (node) => node.type === 'Fleet'));
  h.cleanup();
});

test('vehicle subscriptions are scoped to the signed-in driver and cleaned up', () => {
  const subscriptions = [];
  let cleanupCount = 0;
  const h = screenHarness('DriverHomeScreen.js', { userProfile: profile }, { services: {
    subscribeToDriverVehicles: (uid, notify) => {
      subscriptions.push(uid);
      notify([{ id: 'vehicle', isActive: true }]);
      return () => { cleanupCount++; };
    },
  } });
  h.render();
  tab(h.render(), 'My Fleet').props.onPress();
  assert.equal(find(h.render(), (node) => node.type === 'Fleet').props.vehicles.length, 1);
  assert.deepEqual(subscriptions, ['driver-1']);
  h.cleanup();
  assert.equal(cleanupCount, 1);
});

test('fleet actions explicitly select or remove only the chosen vehicle', async () => {
  const calls = [];
  const vehicles = [{ id: 'lorry', isActive: true }, { id: 'van', isActive: false }];
  const h = screenHarness('DriverVehiclesListScreen.js', { userProfile: profile, vehicles }, { services: {
    setActiveDriverVehicle: async (...args) => { calls.push(args); return { success: true }; },
  } });
  await button(h.render(), 'Remove from dispatch').props.onPress();
  const select = find(h.render(), (node) => node.type === 'TouchableOpacity' && /Set as Active Vehicle/.test(node.props.accessibilityLabel || ''));
  await select.props.onPress();
  assert.deepEqual(calls, [['driver-1', 'lorry', false], ['driver-1', 'van', true]]);
  assert.ok(!elements(h.render()).some((node) => node.type === 'Switch'));
});

test('failed dispatch changes show feedback and release the busy state', async () => {
  const h = screenHarness('DriverVehiclesListScreen.js', { userProfile: profile, vehicles: [{ id: 'lorry', isActive: true }] }, { services: {
    setActiveDriverVehicle: async () => ({ success: false, error: 'Permission denied' }),
  } });
  await button(h.render(), 'Remove from dispatch').props.onPress();
  assert.equal(h.alerts[0][1], 'Permission denied');
  assert.equal(button(h.render(), 'Remove from dispatch').props.disabled, false);
});

test('vehicle deletion requires confirmation before calling the service', async () => {
  const calls = [];
  const h = screenHarness('DriverVehiclesListScreen.js', { userProfile: profile, vehicles: [{ id: 'lorry', plateNumber: 'WP-1234' }] }, { services: {
    deleteDriverVehicle: async (...args) => { calls.push(args); return { success: true }; },
  } });
  find(h.render(), (node) => node.type === 'TouchableOpacity' && /Delete/.test(text(node))).props.onPress();
  assert.equal(calls.length, 0);
  await h.alerts[0][2].find((action) => action.style === 'destructive').onPress();
  assert.deepEqual(calls, [['lorry', 'driver-1']]);
});

const submitButton = (tree) => find(tree, (node) => node.type === 'TouchableOpacity' && node.props.onPress?.name === 'handleSubmit');
test('vehicle form prevents submission when plate and model are missing', async () => {
  let saves = 0;
  const h = screenHarness('AddVehicleScreen.js', { userProfile: profile }, { services: {
    addDriverVehicle: async () => { saves++; return { success: true }; },
  } });
  await submitButton(h.render()).props.onPress();
  assert.equal(saves, 0);
  assert.equal(h.alerts[0][0], 'Incomplete Information');
});

test('vehicle edits normalise the plate and district and call update instead of add', async () => {
  const calls = [];
  const h = screenHarness('AddVehicleScreen.js', { userProfile: profile, initialVehicle: {
    id: 'lorry', plateNumber: ' wp-1234 ', makeModel: ' Lorry ', capacity: 2500,
    district: { nameEn: 'Kandy', nameSi: 'මහනුවර' }, image: 'https://example.test/lorry.jpg',
  } }, { services: {
    updateDriverVehicle: async (...args) => { calls.push(args); return { success: true }; },
    addDriverVehicle: async () => { throw new Error('Edit must not create a new vehicle'); },
  } });
  await submitButton(h.render()).props.onPress();
  assert.equal(calls[0][0], 'lorry');
  assert.equal(calls[0][1].plateNumber, 'WP-1234');
  assert.equal(calls[0][1].makeModel, 'Lorry');
  assert.equal(calls[0][1].district, 'Kandy');
  assert.equal(calls[0][1].capacity, 2500);
  assert.equal(calls[0][2], 'driver-1');
});

const trackingProps = (status = 'ASSIGNED') => ({
  userProfile: profile,
  delivery: { id: 'order-1', status, driverId: 'driver-1', driverName: 'Test Driver' },
  onRejectDelivery: async () => ({ success: true }),
});
test('assigned driver sees acceptance/rejection controls and their own photo', () => {
  const h = screenHarness('DeliveryTrackingScreen.js', trackingProps());
  const tree = h.render();
  assert.ok(button(tree, 'Accept Delivery'));
  assert.ok(button(tree, 'Reject Delivery'));
  assert.ok(elements(tree).some((node) => node.type === 'Image' && node.props.source.uri === profile.photoURL));
  assert.ok(!elements(tree).some((node) => node.type === 'TouchableOpacity' && text(node) === 'Message'));
  h.cleanup();
});

test('acceptance opens confirmation and uses the driver acceptance service', async () => {
  const calls = [];
  const h = screenHarness('DeliveryTrackingScreen.js', trackingProps(), { services: {
    acceptDriverDelivery: async (...args) => { calls.push(args); return { success: true }; },
  } });
  button(h.render(), 'Accept Delivery').props.onPress();
  assert.equal(calls.length, 0);
  await button(h.render(), 'Confirm').props.onPress();
  assert.deepEqual(calls, [['order-1', 'driver-1']]);
  h.cleanup();
});

test('rejection asks for confirmation and passes the selected order ID', async () => {
  const calls = [];
  const h = screenHarness('DeliveryTrackingScreen.js', { ...trackingProps(), onRejectDelivery: async (id) => { calls.push(id); return { success: true }; } });
  button(h.render(), 'Reject Delivery').props.onPress();
  assert.equal(calls.length, 0);
  const confirmation = find(h.render(), (node) => node.type === 'TouchableOpacity' && node.props.onPress?.name === 'handleRejectDelivery');
  await confirmation.props.onPress();
  assert.deepEqual(calls, ['order-1']);
  h.cleanup();
});

test('in-transit driver cannot accept or reject after pickup', () => {
  const h = screenHarness('DeliveryTrackingScreen.js', trackingProps('IN_TRANSIT'));
  const labels = elements(h.render()).map((node) => node.props.accessibilityLabel);
  assert.ok(!labels.includes('Accept Delivery'));
  assert.ok(!labels.includes('Reject Delivery'));
  h.cleanup();
});
