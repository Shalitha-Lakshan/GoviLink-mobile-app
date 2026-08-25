import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { db, auth, storage } from '../firebaseConfig';

// -------------------------------------------------------
// PRODUCE LISTINGS & IMAGE UPLOADS
// -------------------------------------------------------

/**
 * Upload produce image to Firebase Storage (with base64 fallback)
 * Ensures the image is hosted and accessible across all devices & users.
 */
export const uploadProduceImage = async (imageUri, produceId) => {
  if (!imageUri) return null;

  // 1. If already a remote web URL, keep as is
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }

  const uniqueId = produceId || `produce_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const storagePath = `produce_images/${uniqueId}.jpg`;
  const storageRef = ref(storage, storagePath);

  // 2. Try uploading to Firebase Storage
  try {
    if (imageUri.startsWith('data:')) {
      await uploadString(storageRef, imageUri, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
  } catch (storageError) {
    console.warn('Firebase Storage upload warning, using data URL fallback:', storageError);

    // 3. Fallback: If it is already a base64 data URL, return it
    if (imageUri.startsWith('data:')) {
      return imageUri;
    }

    // 4. Convert local file:// URI to base64 data URL
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return base64Data;
    } catch (fallbackError) {
      console.error('Failed to convert image to fallback data URL:', fallbackError);
      return imageUri;
    }
  }
};

/**
 * Real-time listener for Produce Marketplace Listings in Firestore
 */
export const subscribeToProduceListings = (onUpdate) => {
  const produceRef = collection(db, 'produce');

  return onSnapshot(produceRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    onUpdate(items);
  }, (error) => {
    console.error('Firestore produce subscription error:', error);
  });
};

/**
 * Add a new produce listing to Firestore
 */
export const addProduceListing = async (produceData) => {
  try {
    let finalImageUrl = produceData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl);
    }

    const produceRef = collection(db, 'produce');
    const docRef = await addDoc(produceRef, {
      ...produceData,
      image: finalImageUrl || produceData.image,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding produce to Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing produce listing
 */
export const updateProduceListing = async (produceId, updatedData) => {
  try {
    let finalImageUrl = updatedData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, produceId);
    }

    const produceDocRef = doc(db, 'produce', produceId);
    await updateDoc(produceDocRef, {
      ...updatedData,
      image: finalImageUrl || updatedData.image,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating produce:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a produce listing
 */
export const deleteProduceListing = async (produceId) => {
  try {
    const produceDocRef = doc(db, 'produce', produceId);
    await deleteDoc(produceDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting produce:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// ORDERS
// -------------------------------------------------------

/**
 * Place a new Order in Firestore
 */
export const placeOrderInFirestore = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error placing order in Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update order status (e.g. PENDING -> ACCEPTED -> IN_TRANSIT -> DELIVERED)
 */
export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      ...extraData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for Orders in Firestore
 */
export const subscribeToOrders = (onUpdate) => {
  const ordersRef = collection(db, 'orders');

  return onSnapshot(ordersRef, (snapshot) => {
    const orders = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    onUpdate(orders);
  }, (error) => {
    console.error('Firestore orders subscription error:', error);
  });
};

// -------------------------------------------------------
// USER PROFILE
// -------------------------------------------------------

/**
 * Get user profile from Firestore users/{uid}
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { success: true, profile: userDocSnap.data() };
    }
    return { success: false, error: 'User profile not found in Firestore.' };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------

/**
 * Register User with Firebase Authentication & Save Profile to Firestore.
 * NEVER stores the password in Firestore.
 *
 * @param {object} userData
 * @param {string} userData.fullName
 * @param {string} userData.email
 * @param {string} userData.phoneNumber
 * @param {string} userData.password       (used for Firebase Auth only, never stored in Firestore)
 * @param {string} userData.role           ('farmer' | 'buyer' | 'cooperative_admin' | 'driver')
 * @param {object} [userData.district]     optional district object
 */
export const registerWithFirebase = async (userData) => {
  try {
    const { email, password, fullName, phoneNumber, role, district } = userData;

    // 1. Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Build Firestore profile — password is NOT included
    const profile = {
      uid: user.uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      role: role || 'buyer',
      ...(district ? { district } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Write to users/{uid}
    await setDoc(doc(db, 'users', user.uid), profile);

    // 4. Sign out so user must explicitly log in after registering
    await firebaseSignOut(auth);

    return { success: true, user, profile };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.code || error.message };
  }
};

/**
 * Sign In User with Firebase Authentication, then fetch Firestore profile.
 *
 * @param {string} email
 * @param {string} password
 */
export const loginWithFirebase = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === 'govilink@admin.lk';

  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (authErr) {
      // If admin account doesn't exist in Firebase Auth yet, auto-create it
      if (isAdminEmail && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch (_createErr) {
          throw authErr;
        }
      } else {
        throw authErr;
      }
    }

    const user = userCredential.user;

    // Fetch Firestore profile
    const profileResult = await getUserProfile(user.uid);

    // If profile doc missing or email is admin, ensure profile doc with cooperative_admin role exists
    if (!profileResult.success || isAdminEmail) {
      const adminProfile = {
        uid: user.uid,
        email: cleanEmail,
        fullName: profileResult?.profile?.fullName || 'GoviLink Cooperative Admin',
        phoneNumber: profileResult?.profile?.phoneNumber || '0770000000',
        role: 'cooperative_admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), adminProfile);
      return { success: true, user, profile: adminProfile };
    }

    return { success: true, user, profile: profileResult.profile };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.code || error.message };
  }
};

/**
 * Sign out the current user
 */
export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Legacy — kept for backward compatibility
export const saveUserToFirestore = async (userData) => {
  if (!userData.uid) return { success: false, error: 'No uid provided' };
  try {
    await setDoc(doc(db, 'users', userData.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// FLEET & DRIVERS MANAGEMENT
// -------------------------------------------------------

export const DEFAULT_COOP_DRIVERS = [
  {
    id: 'driver_default_1',
    uid: 'driver_default_1',
    fullName: 'Sunil Perera',
    phoneNumber: '077 123 4567',
    vehicleNumber: 'WP-CAB-4521',
    vehicleType: 'lorry_heavy',
    vehicleTypeLabel: 'Heavy Duty Truck (10T)',
    capacity: 3500,
    rating: '4.9',
    district: { id: 'colombo', nameEn: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
    isAvailable: true,
  },
  {
    id: 'driver_default_2',
    uid: 'driver_default_2',
    fullName: 'Kasun Bandara',
    phoneNumber: '071 987 6543',
    vehicleNumber: 'CP-ND-8890',
    vehicleType: 'refrigerated',
    vehicleTypeLabel: 'Refrigerated Cold Chain Truck',
    capacity: 2000,
    rating: '5.0',
    district: { id: 'kandy', nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' },
    isAvailable: true,
  },
  {
    id: 'driver_default_3',
    uid: 'driver_default_3',
    fullName: 'Nuwan Jayasinghe',
    phoneNumber: '076 555 1234',
    vehicleNumber: 'WP-LH-2311',
    vehicleType: 'lorry_light',
    vehicleTypeLabel: 'Light Truck (3.5T)',
    capacity: 1500,
    rating: '4.8',
    district: { id: 'kurunegala', nameEn: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருணாகல்' },
    isAvailable: true,
  },
  {
    id: 'driver_default_4',
    uid: 'driver_default_4',
    fullName: 'Kamal Fernando',
    phoneNumber: '070 222 3344',
    vehicleNumber: 'SP-DA-1092',
    vehicleType: 'dimo_batta',
    vehicleTypeLabel: 'Dimo Batta / Small Truck',
    capacity: 800,
    rating: '4.7',
    district: { id: 'nuwara_eliya', nameEn: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', nameTa: 'நுவரெலியா' },
    isAvailable: true,
  },
];

/**
 * Check if a driver is currently busy with an active shipment
 */
export const checkDriverAvailability = (driver, ordersList = []) => {
  if (!driver) return { isAvailable: false, activeOrder: null, reason: 'Driver not found' };
  const driverId = driver.uid || driver.id;
  const driverPhone = driver.phoneNumber;

  const activeOrder = (ordersList || []).find((order) => {
    const matchesDriver =
      (order.driverId && order.driverId === driverId) ||
      (order.driverPhone && driverPhone && order.driverPhone === driverPhone);
    const isOngoing =
      order.status === 'ACCEPTED' ||
      order.status === 'ASSIGNED' ||
      order.status === 'PICKED_UP' ||
      order.status === 'IN_TRANSIT' ||
      order.status === 'PENDING_DELIVERY';
    return matchesDriver && isOngoing;
  });

  if (activeOrder) {
    return {
      isAvailable: false,
      activeOrder,
      reason: `Assigned: ${activeOrder.produceName || 'Produce shipment'} (${activeOrder.status || 'In Transit'})`,
    };
  }

  return {
    isAvailable: true,
    activeOrder: null,
    reason: null,
  };
};

/**
 * Real-time listener for Cooperative Fleet Drivers
 */
export const subscribeToDrivers = (onUpdate) => {
  const usersRef = collection(db, 'users');
  const driversQuery = query(usersRef, where('role', '==', 'driver'));

  return onSnapshot(
    driversQuery,
    (snapshot) => {
      const realDrivers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        uid: docSnap.id,
        ...docSnap.data(),
      }));

      if (realDrivers.length > 0) {
        onUpdate(realDrivers);
      } else {
        onUpdate(DEFAULT_COOP_DRIVERS);
      }
    },
    (error) => {
      console.warn('Firestore drivers subscription warning, using defaults:', error);
      onUpdate(DEFAULT_COOP_DRIVERS);
    }
  );
};

/**
 * Assign a driver to an order
 */
export const assignDriverToOrder = async (orderId, driver) => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const driverPayload = {
      driverId: driver.uid || driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phoneNumber,
      driverVehicle: driver.vehicleNumber || driver.plateNumber || driver.makeModel || 'Transport Vehicle',
      driverVehicleType: driver.vehicleType || 'lorry',
      status: 'IN_TRANSIT',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(orderDocRef, driverPayload);
    return { success: true };
  } catch (error) {
    console.error('Error assigning driver to order:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// BUYER CUSTOM PRODUCE REQUESTS
// -------------------------------------------------------

/**
 * Real-time listener for Buyer Produce Requests
 */
export const subscribeToBuyerRequests = (onUpdate, buyerUid = null) => {
  const requestsRef = collection(db, 'buyerRequests');

  return onSnapshot(
    requestsRef,
    (snapshot) => {
      let requests = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      if (buyerUid) {
        requests = requests.filter((r) => r.buyerUid === buyerUid || r.buyerId === buyerUid);
      }

      onUpdate(requests);
    },
    (error) => {
      console.error('Firestore buyer requests subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Create a new Buyer Custom Produce Request
 */
export const createBuyerCustomRequest = async (requestData) => {
  try {
    const requestsRef = collection(db, 'buyerRequests');
    const docRef = await addDoc(requestsRef, {
      ...requestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a Buyer Custom Request
 */
export const deleteBuyerRequest = async (requestId) => {
  try {
    const reqDocRef = doc(db, 'buyerRequests', requestId);
    await deleteDoc(reqDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Farmer accepts a Buyer Custom Request -> Creates an active order
 */
export const acceptBuyerCustomRequest = async (request, farmerProfile) => {
  try {
    const ordersRef = collection(db, 'orders');
    const newOrder = {
      buyerId: request.buyerUid || request.buyerId || 'buyer',
      buyerName: request.buyerName || 'GoviLink Buyer',
      buyerPhone: request.buyerPhone || '',
      farmerId: farmerProfile?.uid || 'farmer',
      farmerName: farmerProfile?.fullName || 'GoviLink Farmer',
      farmerPhone: farmerProfile?.phoneNumber || '',
      produceName: request.cropName || request.cropTitle || 'Requested Produce',
      qty: request.quantity || 1,
      unit: request.unit || 'kg',
      unitPrice: request.targetPricePerUnit || 0,
      totalPrice: (Number(request.targetPricePerUnit) || 0) * (Number(request.quantity) || 1),
      pickupLocation: farmerProfile?.district?.nameEn || 'Farmer Farm Origin',
      deliveryAddress: request.deliveryAddress || 'Distribution Center',
      status: 'PENDING',
      notes: request.notes || '',
      requestId: request.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(ordersRef, newOrder);

    if (request.id) {
      const reqDocRef = doc(db, 'buyerRequests', request.id);
      await updateDoc(reqDocRef, {
        status: 'FULFILLED',
        fulfilledByFarmerId: farmerProfile?.uid,
        fulfilledByFarmerName: farmerProfile?.fullName,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting buyer custom request:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// DRIVER VEHICLES MANAGEMENT
// -------------------------------------------------------

/**
 * Real-time listener for Driver's registered vehicles
 */
export const subscribeToDriverVehicles = (driverUid, onUpdate) => {
  if (!driverUid) {
    onUpdate([]);
    return () => {};
  }
  const vehiclesRef = collection(db, 'vehicles');
  const q = query(vehiclesRef, where('driverUid', '==', driverUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const vehicles = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(vehicles);
    },
    (error) => {
      console.warn('Firestore driver vehicles subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Add a new vehicle to driver's fleet
 */
export const addDriverVehicle = async (driverUid, vehicleData) => {
  try {
    let finalImageUrl = vehicleData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, `veh_${Date.now()}`);
    }

    const vehiclesRef = collection(db, 'vehicles');
    const docRef = await addDoc(vehiclesRef, {
      ...vehicleData,
      image: finalImageUrl || vehicleData.image,
      driverUid,
      isActive: vehicleData.isActive || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, vehicle: { id: docRef.id, ...vehicleData, driverUid } };
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return { success: false, error: error.message };
  }
};

export const saveDriverVehicle = addDriverVehicle;

/**
 * Update an existing vehicle
 */
export const updateDriverVehicle = async (vehicleId, vehicleData, driverUid) => {
  try {
    let finalImageUrl = vehicleData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, vehicleId);
    }

    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleDocRef, {
      ...vehicleData,
      image: finalImageUrl || vehicleData.image,
      ...(driverUid ? { driverUid } : {}),
      updatedAt: serverTimestamp(),
    });
    return { success: true, vehicle: { id: vehicleId, ...vehicleData } };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a driver's vehicle
 */
export const deleteDriverVehicle = async (vehicleId, driverUid) => {
  try {
    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(vehicleDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set active vehicle for dispatch
 */
export const setActiveDriverVehicle = async (driverUid, vehicleId) => {
  try {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('driverUid', '==', driverUid));
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      await updateDoc(doc(db, 'vehicles', d.id), {
        isActive: d.id === vehicleId,
        updatedAt: serverTimestamp(),
      });
    }

    const activeDocSnap = await getDoc(doc(db, 'vehicles', vehicleId));
    if (activeDocSnap.exists()) {
      const activeData = activeDocSnap.data();
      await updateDoc(doc(db, 'users', driverUid), {
        vehicleNumber: activeData.plateNumber,
        vehicleType: activeData.vehicleType,
        vehicle: activeData,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting active driver vehicle:', error);
    return { success: false, error: error.message };
  }
};
