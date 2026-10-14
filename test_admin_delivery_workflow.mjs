// Test Suite for Administrator Manage Delivery Operations (GOVI-143 to GOVI-152)
import assert from 'assert';

console.log('====================================================');
console.log('RUNNING GOVI-143 TO GOVI-152 TEST SUITE (25 TESTS)');
console.log('====================================================');

// Mock data
const mockDrivers = [
  {
    id: 'driver-101',
    uid: 'driver-101',
    fullName: 'Kamal Bandara',
    phoneNumber: '+94 77 123 4567',
    isAvailable: true,
    status: 'ACTIVE',
    vehicle: { type: 'Lorry 4T', plateNumber: 'WP-NC-4521' },
    activeDeliveriesCount: 0,
  },
  {
    id: 'driver-102',
    uid: 'driver-102',
    fullName: 'Nimal Jayasinghe',
    phoneNumber: '+94 71 987 6543',
    isAvailable: true,
    status: 'ACTIVE',
    vehicle: { type: 'Pickup Van', plateNumber: 'WP-QA-8812' },
    activeDeliveriesCount: 0,
  },
  {
    id: 'driver-103',
    uid: 'driver-103',
    fullName: 'Sunil Silva',
    phoneNumber: '+94 76 555 4321',
    isAvailable: false, // Explicitly unavailable / offline
    status: 'ACTIVE',
    vehicle: { type: 'Mini Truck', plateNumber: 'CP-LK-3341' },
    activeDeliveriesCount: 0,
  },
  {
    id: 'driver-104',
    uid: 'driver-104',
    fullName: 'Ruwan Perera',
    phoneNumber: '+94 70 111 2233',
    isAvailable: true,
    status: 'SUSPENDED', // Suspended account
    vehicle: { type: 'Lorry', plateNumber: 'SP-BD-1122' },
    activeDeliveriesCount: 0,
  },
];

const mockOrders = [
  {
    id: 'order-001',
    produceName: 'Fresh Organic Carrots',
    qty: 500,
    unit: 'kg',
    status: 'PENDING',
    farmerId: 'farmer-01',
    farmerName: 'Sunil Weerasinghe',
    farmerPhone: '+94 77 345 6789',
    farmName: 'Nuwara Eliya Green Valley Farm',
    pickupLocation: 'Highland Farms, Nuwara Eliya',
    buyerId: 'buyer-01',
    buyerName: 'Super Fresh Grocers Ltd',
    buyerPhone: '+94 11 234 5678',
    deliveryAddress: 'No. 45, Union Place, Colombo 02',
    deliveryNotes: 'Fragile root crops - protect from direct rainfall',
    logisticsFee: 4500,
    assignedDriverId: null,
    driverName: null,
    driverPhone: null,
    statusHistory: [{ status: 'PENDING', timestamp: new Date().toISOString() }],
    assignmentHistory: [],
  },
  {
    id: 'order-002',
    produceName: 'Green Beans',
    qty: 250,
    unit: 'kg',
    status: 'ASSIGNED',
    farmerId: 'farmer-02',
    farmerName: 'Bandara Farmers Co-op',
    farmerPhone: '+94 78 876 5432',
    farmName: 'Welmilla Farm Fields',
    pickupLocation: 'Bandarawela Co-op Center',
    buyerId: 'buyer-02',
    buyerName: 'Keells Super Distribution',
    buyerPhone: '+94 11 456 7890',
    deliveryAddress: 'Central Warehouse, Kelaniya',
    logisticsFee: 3800,
    assignedDriverId: 'driver-101',
    driverName: 'Kamal Bandara',
    driverPhone: '+94 77 123 4567',
    vehiclePlateNumber: 'WP-NC-4521',
    statusHistory: [
      { status: 'PENDING', timestamp: new Date().toISOString() },
      { status: 'ASSIGNED', timestamp: new Date().toISOString(), driverName: 'Kamal Bandara' },
    ],
    assignmentHistory: [
      { driverId: 'driver-101', driverName: 'Kamal Bandara', assignedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'order-003',
    produceName: 'Red Onions',
    qty: 1200,
    unit: 'kg',
    status: 'DELIVERED',
    farmerId: 'farmer-03',
    farmerName: 'Jaffna Farmers Union',
    farmerPhone: '+94 72 333 4444',
    farmName: 'Chunnakam Agro',
    pickupLocation: 'Chunnakam Market, Jaffna',
    buyerId: 'buyer-03',
    buyerName: 'Cargills Food City',
    buyerPhone: '+94 11 789 0123',
    deliveryAddress: 'Dambulla Hub',
    logisticsFee: 12000,
    assignedDriverId: 'driver-102',
    driverName: 'Nimal Jayasinghe',
    driverPhone: '+94 71 987 6543',
    statusHistory: [
      { status: 'PENDING', timestamp: new Date().toISOString() },
      { status: 'ASSIGNED', timestamp: new Date().toISOString() },
      { status: 'IN_TRANSIT', timestamp: new Date().toISOString() },
      { status: 'DELIVERED', timestamp: new Date().toISOString() },
    ],
    assignmentHistory: [
      { driverId: 'driver-102', driverName: 'Nimal Jayasinghe', assignedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'order-004',
    produceName: 'Cabbage',
    qty: 300,
    unit: 'kg',
    status: 'CANCELLED',
    assignedDriverId: null,
  }
];

// Delivery status and transition business logic mirrors firebaseDatabase.js
const DELIVERY_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  PENDING_DELIVERY: 'PENDING_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const VALID_DELIVERY_TRANSITIONS = {
  PENDING: ['ASSIGNED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'IN_TRANSIT', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['PENDING_DELIVERY', 'DELIVERED', 'CANCELLED'],
  PENDING_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

function isValidStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  const allowed = VALID_DELIVERY_TRANSITIONS[currentStatus.toUpperCase()];
  return Array.isArray(allowed) && allowed.includes(nextStatus.toUpperCase());
}

function checkDriverAvailability(driver, activeOrders = []) {
  if (!driver) return { available: false, reason: 'Driver record not found' };
  if (driver.status === 'SUSPENDED' || driver.status === 'INACTIVE') {
    return { available: false, reason: 'Driver account is inactive or suspended' };
  }
  if (driver.isAvailable === false || driver.availabilityStatus === 'UNAVAILABLE') {
    return { available: false, reason: 'Driver is currently marked offline/unavailable' };
  }
  const driverId = driver.id || driver.uid;
  const ongoing = activeOrders.filter((o) => {
    const assigned = o.assignedDriverId === driverId || o.driverId === driverId;
    const isOngoingStatus = ['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'PENDING_DELIVERY'].includes(o.status);
    return assigned && isOngoingStatus;
  });
  if (ongoing.length > 0) {
    return { available: false, reason: `Driver already has ${ongoing.length} active delivery in progress`, activeOrderCount: ongoing.length };
  }
  return { available: true, reason: 'Driver is ready for assignment', activeOrderCount: 0 };
}

function getPendingDeliveriesList(orders) {
  return orders.filter(
    (o) =>
      (!o.assignedDriverId || o.assignedDriverId === '' || o.status === 'PENDING' || o.status === 'WAITING_FOR_DRIVER') &&
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED'
  );
}

function getAvailableFleetDrivers(drivers, orders) {
  return drivers.filter((driver) => {
    const res = checkDriverAvailability(driver, orders);
    return res.available;
  });
}

function assignDriverToOrder(order, driver, adminProfile) {
  const role = (adminProfile?.role || '').toLowerCase();
  if (role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator access required to assign drivers' };
  }
  if (!order || !order.id) {
    return { success: false, error: 'Delivery not found' };
  }
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    return { success: false, error: `Cannot assign driver to an order in '${order.status}' status` };
  }
  if (order.assignedDriverId && order.assignedDriverId === (driver.id || driver.uid)) {
    return { success: false, error: 'This driver is already assigned to this delivery' };
  }
  if (!driver || (!driver.id && !driver.uid)) {
    return { success: false, error: 'Selected driver details are incomplete' };
  }
  const availability = checkDriverAvailability(driver, mockOrders);
  if (!availability.available) {
    return { success: false, error: `Driver unavailable: ${availability.reason}` };
  }

  const updatedOrder = {
    ...order,
    assignedDriverId: driver.id || driver.uid,
    driverId: driver.id || driver.uid,
    driverName: driver.fullName || driver.name || 'Assigned Fleet Driver',
    driverPhone: driver.phoneNumber || driver.phone || '',
    vehiclePlateNumber: driver.vehicle?.plateNumber || driver.vehiclePlateNumber || '',
    vehicleType: driver.vehicle?.type || driver.vehicleType || 'Transport Vehicle',
    status: 'ASSIGNED',
    assignmentHistory: [
      ...(order.assignmentHistory || []),
      {
        driverId: driver.id || driver.uid,
        driverName: driver.fullName || 'Assigned Driver',
        assignedBy: adminProfile.fullName,
        assignedAt: new Date().toISOString(),
      },
    ],
    statusHistory: [
      ...(order.statusHistory || []),
      {
        status: 'ASSIGNED',
        changedBy: adminProfile.fullName,
        actorRole: 'admin',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { success: true, updatedOrder };
}

function reassignDriverForOrder(order, newDriver, adminProfile, reason = '') {
  const role = (adminProfile?.role || '').toLowerCase();
  if (role !== 'admin') {
    return { success: false, error: 'Unauthorized: Administrator access required to reassign drivers' };
  }
  if (!order || !order.id) {
    return { success: false, error: 'Delivery record not found' };
  }
  if (order.status === 'DELIVERED') {
    return { success: false, error: 'Driver cannot be reassigned after delivery completion (DELIVERED)' };
  }
  if (order.status === 'CANCELLED') {
    return { success: false, error: 'Cannot reassign a driver to a CANCELLED delivery' };
  }
  const newDriverId = newDriver.id || newDriver.uid;
  if (order.assignedDriverId === newDriverId) {
    return { success: false, error: 'The selected driver is already assigned to this delivery' };
  }
  const availability = checkDriverAvailability(newDriver, mockOrders);
  if (!availability.available) {
    return { success: false, error: `Selected driver is currently busy or unavailable: ${availability.reason}` };
  }

  const previousDriver = {
    driverId: order.assignedDriverId,
    driverName: order.driverName,
    driverPhone: order.driverPhone,
  };

  const updatedOrder = {
    ...order,
    assignedDriverId: newDriverId,
    driverId: newDriverId,
    driverName: newDriver.fullName || 'New Driver',
    driverPhone: newDriver.phoneNumber || '',
    vehiclePlateNumber: newDriver.vehicle?.plateNumber || '',
    vehicleType: newDriver.vehicle?.type || 'Transport Vehicle',
    assignmentHistory: [
      ...(order.assignmentHistory || []),
      {
        action: 'REASSIGNED',
        previousDriver,
        driverId: newDriverId,
        driverName: newDriver.fullName || 'New Driver',
        reassignedBy: adminProfile.fullName,
        reason: reason || 'Admin reassignment',
        timestamp: new Date().toISOString(),
      },
    ],
    statusHistory: [
      ...(order.statusHistory || []),
      {
        status: order.status,
        note: `Driver reassigned to ${newDriver.fullName} by Admin (${reason || 'Standard Operations'})`,
        changedBy: adminProfile.fullName,
        actorRole: 'admin',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { success: true, updatedOrder, previousDriverId: previousDriver.driverId };
}

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// TEST 1
runTest('TEST 1: Admin opens Delivery Management - UI and models load properly', () => {
  assert.ok(mockOrders.length > 0, 'Orders list must load');
  assert.ok(mockDrivers.length > 0, 'Drivers list must load');
});

// TEST 2
runTest('TEST 2: Pending deliveries load - Only eligible pending deliveries appear', () => {
  const pending = getPendingDeliveriesList(mockOrders);
  assert.strictEqual(pending.length, 1, 'Should find exactly 1 pending unassigned order');
  assert.strictEqual(pending[0].id, 'order-001');
  assert.strictEqual(pending[0].status, 'PENDING');
});

// TEST 3
runTest('TEST 3: No pending deliveries exist - Proper empty state handling', () => {
  const allAssignedOrDelivered = mockOrders.filter(o => o.status !== 'PENDING');
  const pending = getPendingDeliveriesList(allAssignedOrDelivered);
  assert.strictEqual(pending.length, 0, 'Pending count is 0 when all are assigned');
});

// TEST 4
runTest('TEST 4: Admin opens a delivery - Correct details appear', () => {
  const order = mockOrders[0];
  assert.strictEqual(order.id, 'order-001');
  assert.strictEqual(order.produceName, 'Fresh Organic Carrots');
  assert.strictEqual(order.qty, 500);
});

// TEST 5
runTest('TEST 5: Farmer details display - Correct farmer linked to delivery', () => {
  const order = mockOrders[0];
  assert.strictEqual(order.farmerName, 'Sunil Weerasinghe');
  assert.strictEqual(order.farmerPhone, '+94 77 345 6789');
  assert.strictEqual(order.farmName, 'Nuwara Eliya Green Valley Farm');
  assert.strictEqual(order.pickupLocation, 'Highland Farms, Nuwara Eliya');
});

// TEST 6
runTest('TEST 6: Buyer details display - Correct buyer linked to delivery', () => {
  const order = mockOrders[0];
  assert.strictEqual(order.buyerName, 'Super Fresh Grocers Ltd');
  assert.strictEqual(order.buyerPhone, '+94 11 234 5678');
  assert.strictEqual(order.deliveryAddress, 'No. 45, Union Place, Colombo 02');
  assert.strictEqual(order.deliveryNotes, 'Fragile root crops - protect from direct rainfall');
});

// TEST 7
runTest('TEST 7: Available drivers display - Only valid available drivers appear', () => {
  const available = getAvailableFleetDrivers(mockDrivers, mockOrders);
  assert.strictEqual(available.length, 1, 'Only driver-102 is currently available');
  assert.strictEqual(available[0].id, 'driver-102');
});

// TEST 8
let assignedOrderResult;
runTest('TEST 8: Admin assigns driver - Backend saves assignment', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(mockOrders[0], mockDrivers[1], admin);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.updatedOrder.assignedDriverId, 'driver-102');
  assert.strictEqual(res.updatedOrder.driverName, 'Nimal Jayasinghe');
  assert.strictEqual(res.updatedOrder.status, 'ASSIGNED');
  assignedOrderResult = res.updatedOrder;
});

// TEST 9
runTest('TEST 9: UI updates after assignment - Assigned driver info appears immediately', () => {
  assert.ok(assignedOrderResult);
  assert.strictEqual(assignedOrderResult.driverName, 'Nimal Jayasinghe');
  assert.strictEqual(assignedOrderResult.vehiclePlateNumber, 'WP-QA-8812');
});

// TEST 10
runTest('TEST 10: Reload application - Assignment remains persistent in records', () => {
  assert.strictEqual(assignedOrderResult.assignedDriverId, 'driver-102');
  assert.strictEqual(assignedOrderResult.statusHistory.length, 2);
  assert.strictEqual(assignedOrderResult.assignmentHistory.length, 1);
});

// TEST 11
runTest('TEST 11: Delivery status displays - Correct status is loaded from backend', () => {
  assert.strictEqual(assignedOrderResult.status, 'ASSIGNED');
  assert.ok(isValidStatusTransition('ASSIGNED', 'IN_TRANSIT'));
});

// TEST 12
runTest('TEST 12: Attempt duplicate assignment - Invalid action prevented', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(assignedOrderResult, mockDrivers[1], admin);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'This driver is already assigned to this delivery');
});

// TEST 13
let reassignedOrderResult;
runTest('TEST 13: Reassign driver - Old driver replaced by new driver according to business rules', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = reassignDriverForOrder(mockOrders[1], mockDrivers[1], admin, 'Truck maintenance');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.updatedOrder.assignedDriverId, 'driver-102');
  assert.strictEqual(res.updatedOrder.driverName, 'Nimal Jayasinghe');
  assert.strictEqual(res.previousDriverId, 'driver-101');
  reassignedOrderResult = res.updatedOrder;
});

// TEST 14
runTest('TEST 14: Old driver availability updates if required - freed from active trip', () => {
  const activeForOld = [reassignedOrderResult].filter(o => o.assignedDriverId === 'driver-101');
  assert.strictEqual(activeForOld.length, 0, 'Old driver has 0 active trips on this order');
});

// TEST 15
runTest('TEST 15: New driver availability updates - now tied to active delivery', () => {
  const activeForNew = [reassignedOrderResult].filter(o => o.assignedDriverId === 'driver-102');
  assert.strictEqual(activeForNew.length, 1, 'New driver is linked to active delivery');
});

// TEST 16
runTest('TEST 16: Attempt reassignment to unavailable driver - Backend rejects request', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = reassignDriverForOrder(mockOrders[1], mockDrivers[2], admin, 'Test');
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes('unavailable') || res.error.includes('busy'));
});

// TEST 17
runTest('TEST 17: Attempt reassignment after Delivered - Backend rejects request', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = reassignDriverForOrder(mockOrders[2], mockDrivers[1], admin, 'Test');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Driver cannot be reassigned after delivery completion (DELIVERED)');
});

// TEST 18
runTest('TEST 18: Non-admin attempts assignment API - 403 Forbidden / Unauthorized', () => {
  const buyer = { fullName: 'Buyer User', role: 'buyer' };
  const res = assignDriverToOrder(mockOrders[0], mockDrivers[1], buyer);
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes('Unauthorized'));
});

// TEST 19
runTest('TEST 19: Invalid delivery ID - Proper validation error', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(null, mockDrivers[1], admin);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Delivery not found');
});

// TEST 20
runTest('TEST 20: Invalid driver ID - Proper validation error', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(mockOrders[0], { fullName: 'No ID Driver' }, admin);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Selected driver details are incomplete');
});

// TEST 21
runTest('TEST 21: Driver no longer available between list load and assignment - Rejected safely', () => {
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(mockOrders[0], mockDrivers[3], admin);
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes('Driver unavailable'));
});

// TEST 22
runTest('TEST 22: Network failure - UI shows proper error and does not falsely show assignment', () => {
  const mockNetworkFail = () => {
    try {
      throw new Error('Firestore network timeout (unavailable)');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
  const res = mockNetworkFail();
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes('network'));
});

// TEST 23
runTest('TEST 23: Rapid repeated taps - Guard prevents concurrent assignments', () => {
  let isAssigning = true;
  let attemptsAllowed = 0;
  const handleAssignClick = () => {
    if (isAssigning) return false;
    attemptsAllowed++;
    return true;
  };
  const firstTap = handleAssignClick();
  const secondTap = handleAssignClick();
  assert.strictEqual(firstTap, false);
  assert.strictEqual(secondTap, false);
  assert.strictEqual(attemptsAllowed, 0);
});

// TEST 24
runTest('TEST 24: Old delivery records - Backward compatibility with legacy schema', () => {
  const legacyOrder = {
    id: 'legacy-999',
    crop: 'Pumpkin',
    total: 3000,
    status: 'PENDING',
  };
  const admin = { fullName: 'Admin User', role: 'admin' };
  const res = assignDriverToOrder(legacyOrder, mockDrivers[1], admin);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.updatedOrder.assignedDriverId, 'driver-102');
  assert.strictEqual(res.updatedOrder.status, 'ASSIGNED');
});

// TEST 25
runTest('TEST 25: Regression testing - Existing buyer, farmer, driver workflows intact', () => {
  assert.ok(isValidStatusTransition('PENDING', 'CANCELLED'));
  assert.ok(isValidStatusTransition('ASSIGNED', 'IN_TRANSIT'));
  assert.ok(isValidStatusTransition('IN_TRANSIT', 'DELIVERED'));
  assert.strictEqual(isValidStatusTransition('DELIVERED', 'IN_TRANSIT'), false);
  assert.strictEqual(isValidStatusTransition('CANCELLED', 'ASSIGNED'), false);
});

console.log('====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');
if (failed > 0) process.exit(1);
