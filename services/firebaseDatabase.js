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
  writeBatch,
  orderBy,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
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
    console.log('Uploading produce image to Storage path:', storagePath);
    if (imageUri.startsWith('data:')) {
      await uploadString(storageRef, imageUri, 'data_url');
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      await uploadString(storageRef, dataUrl, 'data_url');
    }
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Storage upload successful URL:', downloadURL);
    return downloadURL;
  } catch (storageError) {
    console.warn('Storage upload error, attempting fallback:', storageError);
    // 3. Fallback: If it is already a base64 data URL, return it
    if (imageUri.startsWith('data:')) {
      return imageUri;
    }

    // 4. Convert local file:// URI to base64 data URL fallback so remote devices can render it
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const base64Data = await new Promise((resolve, reject) => {
        resolve(`data:image/jpeg;base64,${base64}`);
      });
      return base64Data;
    } catch (_fallbackError) {
      return imageUri;
    }
  }
};

/**
 * Upload user profile image to Firebase Storage
 */
export const uploadProfileImage = async (imageUri, userId) => {
  if (!imageUri) return null;

  // If already a remote web URL, keep as is
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }

  const storagePath = `profile_images/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, storagePath);

  try {
    console.log('Uploading profile image to Storage path:', storagePath);
    if (imageUri.startsWith('data:')) {
      await uploadString(storageRef, imageUri, 'data_url');
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      await uploadString(storageRef, dataUrl, 'data_url');
    }
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Profile image upload successful:', downloadURL);
    return downloadURL;
  } catch (storageError) {
    console.warn('Profile image upload error, using fallback:', storageError);
    if (imageUri.startsWith('data:')) {
      return imageUri;
    }
    // Fallback to base64
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (_fallbackError) {
      return imageUri;
    }
  }
};

/**
 * Upload vehicle image to Firebase Storage
 */
export const uploadVehicleImage = async (imageUri, vehicleId) => {
  if (!imageUri) return null;

  // If already a remote web URL, keep as is
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }

  const storagePath = `vehicle_images/${vehicleId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, storagePath);

  try {
    console.log('Uploading vehicle image to Storage path:', storagePath);
    if (imageUri.startsWith('data:')) {
      await uploadString(storageRef, imageUri, 'data_url');
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      await uploadString(storageRef, dataUrl, 'data_url');
    }
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Vehicle image upload successful:', downloadURL);
    return downloadURL;
  } catch (storageError) {
    console.warn('Vehicle image upload error, using fallback:', storageError);
    if (imageUri.startsWith('data:')) {
      return imageUri;
    }
    // Fallback to base64
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (_fallbackError) {
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
    let finalImageUrl = produceData.image || (Array.isArray(produceData.imageUrls) ? produceData.imageUrls[0] : null);
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl);
    }

    const produceRef = collection(db, 'produce');
    const payload = {
      ...produceData,
      image: finalImageUrl || produceData.image || null,
      imageUrls: finalImageUrl ? [finalImageUrl] : (produceData.imageUrls || []),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(produceRef, payload);
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
    let finalImageUrl = updatedData.image || (Array.isArray(updatedData.imageUrls) ? updatedData.imageUrls[0] : null);
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, produceId);
    }

    const produceDocRef = doc(db, 'produce', produceId);
    const payload = {
      ...updatedData,
      image: finalImageUrl || updatedData.image || null,
      imageUrls: finalImageUrl ? [finalImageUrl] : (updatedData.imageUrls || []),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(produceDocRef, payload);
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

const USER_PROFILE_CACHE_PREFIX = 'govilink_profile_';

const readCachedProfile = async (uid) => {
  if (!uid) return null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${USER_PROFILE_CACHE_PREFIX}${uid}`);
      return raw ? JSON.parse(raw) : null;
    }
    const raw = await AsyncStorage.getItem(`${USER_PROFILE_CACHE_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const writeCachedProfile = async (uid, profile) => {
  if (!uid || !profile) return;
  try {
    const raw = JSON.stringify(profile);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${USER_PROFILE_CACHE_PREFIX}${uid}`, raw);
      return;
    }
    await AsyncStorage.setItem(`${USER_PROFILE_CACHE_PREFIX}${uid}`, raw);
  } catch (_error) {
    // Ignore cache write failures
  }
};

/**
 * Get user profile from Firestore users/{uid}
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const profile = userDocSnap.data();
      await writeCachedProfile(uid, profile);
      return { success: true, profile };
    }
    const cachedProfile = await readCachedProfile(uid);
    if (cachedProfile) {
      return { success: true, profile: cachedProfile, cached: true };
    }
    return { success: false, error: 'User profile not found in Firestore.' };
  } catch (error) {
    const cachedProfile = await readCachedProfile(uid);
    if (cachedProfile) {
      console.warn('Using cached user profile because Firestore is unavailable.');
      return { success: true, profile: cachedProfile, cached: true };
    }
    console.warn('Error fetching user profile:', error?.message || error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile in Firestore users/{uid}
 */
export const updateUserProfileInFirestore = async (uid, profileData) => {
  if (!uid) {
    console.warn('updateUserProfileInFirestore: No uid provided');
    return { success: false, error: 'No user ID provided' };
  }

  try {
    // Safety check: if photoURL base64 is larger than 800KB, omit photoURL from Firestore doc
    // to prevent exceeding Firestore's 1MB single-document limit.
    const cleanProfileData = { ...profileData };
    if (cleanProfileData.photoURL && cleanProfileData.photoURL.length > 800000) {
      delete cleanProfileData.photoURL;
    }

    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...cleanProfileData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await writeCachedProfile(uid, cleanProfileData);
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
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
    await writeCachedProfile(user.uid, profile);

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
      // If default admin account doesn't exist in Firebase Auth yet, auto-create it
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

    // Fetch Firestore profile from users/{uid}
    const profileResult = await getUserProfile(user.uid);

    if (profileResult.success) {
      const existingProfile = profileResult.profile;
      // If admin email login, ensure role is set to cooperative_admin if missing
      if (isAdminEmail && existingProfile.role !== 'cooperative_admin') {
        const updatedProfile = { ...existingProfile, role: 'cooperative_admin' };
        await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
        return { success: true, user, profile: updatedProfile };
      }
      return { success: true, user, profile: existingProfile };
    }

    // Profile document missing in Firestore — initialize user profile document
    const newProfile = {
      uid: user.uid,
      email: cleanEmail,
      fullName: isAdminEmail ? 'GoviLink Cooperative Admin' : (user.displayName || 'GoviLink User'),
      phoneNumber: '0770000000',
      role: isAdminEmail ? 'cooperative_admin' : 'buyer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    return { success: true, user, profile: newProfile };
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

      onUpdate(realDrivers || []);
    },
    (error) => {
      console.warn('Firestore drivers subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Assign a driver to an order (creates or updates order document in Firestore)
 */
export const assignDriverToOrder = async (orderOrId, driver) => {
  try {
    const orderId = typeof orderOrId === 'object' ? orderOrId.id : orderOrId;
    const orderObj = typeof orderOrId === 'object' ? orderOrId : {};

    const orderDocRef = doc(db, 'orders', orderId);
    const driverPayload = {
      ...(orderObj.produceName ? { produceName: orderObj.produceName } : {}),
      ...(orderObj.farmerName ? { farmerName: orderObj.farmerName } : {}),
      ...(orderObj.pickupLocation ? { pickupLocation: orderObj.pickupLocation } : {}),
      ...(orderObj.deliveryAddress ? { deliveryAddress: orderObj.deliveryAddress } : {}),
      ...(orderObj.qty ? { qty: orderObj.qty } : {}),
      ...(orderObj.unit ? { unit: orderObj.unit } : {}),
      driverId: driver.uid || driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phoneNumber,
      driverVehicle: driver.vehicleNumber || driver.plateNumber || driver.makeModel || 'Transport Vehicle',
      driverVehicleType: driver.vehicleType || 'lorry',
      status: 'IN_TRANSIT',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(orderDocRef, driverPayload, { merge: true });
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
 * Farmer accepts a Buyer Custom Request -> Creates an active order + transport request
 * Guards against double-acceptance.
 */
export const acceptBuyerCustomRequest = async (request, farmerProfile) => {
  try {
    // Guard: do not accept an already-accepted request
    if (request.status === 'ACCEPTED' || request.status === 'FULFILLED') {
      return { success: false, error: 'This request has already been accepted.' };
    }

    const farmerId = farmerProfile?.uid || auth.currentUser?.uid || 'farmer';
    const farmerName = farmerProfile?.fullName || 'GoviLink Farmer';
    const farmerPhone = farmerProfile?.phoneNumber || '';
    const pickupLocation = farmerProfile?.district?.nameEn || 'Farm Origin';

    const orderNo = `ORD-${Date.now().toString().slice(-6)}`;
    const qty = Number(request.quantity) || 1;
    const unitPrice = Number(request.targetPricePerUnit) || Number(request.offeredPrice) || 0;
    const totalPrice = unitPrice * qty;

    const newOrder = {
      orderNo,
      buyerId: request.buyerUid || request.buyerId || '',
      buyerName: request.buyerName || 'GoviLink Buyer',
      buyerPhone: request.buyerPhone || '',
      farmerId,
      farmerName,
      farmerPhone,
      produceName: request.cropName || request.cropTitle || 'Requested Produce',
      qty,
      unit: request.unit || 'kg',
      unitPrice,
      totalPrice,
      pickupLocation,
      deliveryAddress: request.deliveryAddress || 'Distribution Center',
      status: 'PENDING',
      transportStatus: 'PENDING_TRANSPORT',
      notes: request.notes || '',
      requestId: request.id || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ordersRef = collection(db, 'orders');
    const orderDocRef = await addDoc(ordersRef, newOrder);
    const orderId = orderDocRef.id;

    // Create transport request
    await createTransportRequest(
      { ...newOrder, id: orderId, orderNo },
      farmerProfile
    );

    // Mark the buyer request as ACCEPTED
    if (request.id) {
      const reqDocRef = doc(db, 'buyerRequests', request.id);
      await updateDoc(reqDocRef, {
        status: 'ACCEPTED',
        acceptedByFarmerId: farmerId,
        acceptedByFarmerName: farmerName,
        orderId,
        updatedAt: serverTimestamp(),
      });
    }

    // Notify the farmer
    await createFarmerNotification(farmerId, {
      type: 'REQUEST_ACCEPTED',
      title: 'Request Accepted ✅',
      body: `You accepted the request for ${request.cropName || 'produce'} from ${request.buyerName || 'Buyer'}. Order #${orderNo} created.`,
      orderId,
      requestId: request.id || '',
    });

    return { success: true, orderId, orderNo };
  } catch (error) {
    console.error('Error accepting buyer custom request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Farmer rejects a Buyer Custom Request
 */
export const rejectBuyerCustomRequest = async (requestId, farmerProfile, reason = '') => {
  try {
    if (!requestId) return { success: false, error: 'Request ID is required.' };
    const farmerId = farmerProfile?.uid || auth.currentUser?.uid || '';
    const reqDocRef = doc(db, 'buyerRequests', requestId);
    await updateDoc(reqDocRef, {
      status: 'REJECTED',
      rejectedByFarmerId: farmerId,
      rejectedByFarmerName: farmerProfile?.fullName || '',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error rejecting buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a transport request document when an order is accepted
 */
export const createTransportRequest = async (orderData, farmerProfile) => {
  try {
    const farmerId = farmerProfile?.uid || auth.currentUser?.uid || orderData.farmerId || '';
    const transportRef = collection(db, 'transportRequests');
    const payload = {
      orderId: orderData.id || orderData.orderId || '',
      orderNo: orderData.orderNo || '',
      farmerId,
      farmerName: farmerProfile?.fullName || orderData.farmerName || '',
      farmerPhone: farmerProfile?.phoneNumber || orderData.farmerPhone || '',
      buyerId: orderData.buyerId || '',
      buyerName: orderData.buyerName || '',
      buyerPhone: orderData.buyerPhone || '',
      produceName: orderData.produceName || '',
      quantity: orderData.qty || 0,
      unit: orderData.unit || 'kg',
      pickupLocation: orderData.pickupLocation || farmerProfile?.district?.nameEn || '',
      deliveryDestination: orderData.deliveryAddress || '',
      requestedDate: serverTimestamp(),
      status: 'PENDING',
      driverId: null,
      driverName: null,
      driverPhone: null,
      driverVehicle: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(transportRef, payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating transport request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for transport requests belonging to a farmer
 */
export const subscribeToTransportRequests = (farmerUid, onUpdate) => {
  if (!farmerUid) {
    onUpdate([]);
    return () => { };
  }
  const transportRef = collection(db, 'transportRequests');
  const q = query(transportRef, where('farmerId', '==', farmerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(items);
    },
    (error) => {
      console.warn('Transport requests subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Real-time listener for orders belonging to a specific farmer
 */
export const subscribeToFarmerOrders = (farmerUid, onUpdate) => {
  if (!farmerUid) {
    onUpdate([]);
    return () => { };
  }
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('farmerId', '==', farmerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(orders);
    },
    (error) => {
      console.warn('Farmer orders subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Create a notification for a farmer in Firestore
 */
export const createFarmerNotification = async (farmerUid, notifData) => {
  try {
    if (!farmerUid) return { success: false, error: 'farmerUid required' };
    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      targetUid: farmerUid,
      type: notifData.type || 'INFO',
      title: notifData.title || 'Notification',
      body: notifData.body || '',
      read: false,
      orderId: notifData.orderId || null,
      requestId: notifData.requestId || null,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.warn('Error creating farmer notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for farmer's notifications (ordered newest first)
 */
export const subscribeToFarmerNotifications = (farmerUid, onUpdate) => {
  if (!farmerUid) {
    onUpdate([]);
    return () => { };
  }
  const notifsRef = collection(db, 'notifications');
  const q = query(notifsRef, where('targetUid', '==', farmerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      onUpdate(items);
    },
    (error) => {
      console.warn('Notifications subscription error:', error?.message || error);
      onUpdate([]);
    }
  );
};

/**
 * Mark all unread notifications as read for a farmer
 */
export const markFarmerNotificationsRead = async (farmerUid) => {
  try {
    if (!farmerUid) return;
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('targetUid', '==', farmerUid), where('read', '==', false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    console.warn('Error marking notifications read:', error);
  }
};

/**
 * Real-time listener for buyer requests relevant to a farmer
 * Shows: open/pending requests (not yet accepted/rejected) + requests accepted by this farmer
 */
export const subscribeToFarmerRequests = (farmerUid, onUpdate) => {
  const requestsRef = collection(db, 'buyerRequests');
  return onSnapshot(
    requestsRef,
    (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Show: open requests (for farmer to respond to) OR requests already acted on by this farmer
      const relevant = all.filter((r) => {
        const isOpen = !r.status || r.status === 'OPEN' || r.status === 'PENDING';
        const isActedByMe = r.acceptedByFarmerId === farmerUid || r.rejectedByFarmerId === farmerUid;
        return isOpen || isActedByMe;
      });
      onUpdate(relevant);
    },
    (error) => {
      console.warn('Farmer requests subscription error:', error);
      onUpdate([]);
    }
  );
};

// -------------------------------------------------------
// DRIVER VEHICLES MANAGEMENT
// -------------------------------------------------------

/**
 * Remove undefined properties from an object so Firestore addDoc/updateDoc never throws "Unsupported field value: undefined".
 */
export const cleanFirestorePayload = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && typeof val.toDate !== 'function') {
        cleaned[key] = cleanFirestorePayload(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned;
};

/**
 * Real-time listener for Driver's registered vehicles
 */
export const subscribeToDriverVehicles = (driverUid, onUpdate, onError) => {
  const activeUid = driverUid || auth.currentUser?.uid || '';
  const vehiclesRef = collection(db, 'vehicles');

  return onSnapshot(
    vehiclesRef,
    (snapshot) => {
      const vehicles = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((v) => {
          if (!activeUid) return true; // If no UID specified, show driver vehicle pool
          return (
            v.driverUid === activeUid ||
            v.assignedDriverId === activeUid ||
            v.createdBy === activeUid ||
            !v.driverUid
          );
        });
      onUpdate(vehicles);
    },
    (error) => {
      console.warn('Firestore driver vehicles subscription error:', error);
      if (onError) onError(error);
      else onUpdate([]);
    }
  );
};

/**
 * Real-time listener for ALL vehicles in Firestore (for Admin Dashboard & fleet metrics)
 */
export const subscribeToAllVehicles = (onUpdate) => {
  const vehiclesRef = collection(db, 'vehicles');

  return onSnapshot(
    vehiclesRef,
    (snapshot) => {
      const vehicles = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(vehicles);
    },
    (error) => {
      console.warn('Firestore all vehicles subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Add a new vehicle to driver's fleet
 */
export const addDriverVehicle = async (driverUid, vehicleData) => {
  try {
    const activeUid = driverUid || auth.currentUser?.uid || 'driver_default';
    let finalImageUrl = vehicleData.image || null;
    if (
      finalImageUrl &&
      typeof finalImageUrl === 'string' &&
      !finalImageUrl.startsWith('http://') &&
      !finalImageUrl.startsWith('https://') &&
      !finalImageUrl.startsWith('data:image')
    ) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, `veh_${Date.now()}`);
    }

    const payload = cleanFirestorePayload({
      ...vehicleData,
      plateNumber: (vehicleData.plateNumber || vehicleData.vehicleNumber || '').toUpperCase(),
      vehicleNumber: (vehicleData.vehicleNumber || vehicleData.plateNumber || '').toUpperCase(),
      vehicleType: vehicleData.vehicleType || vehicleData.makeModel || 'Lorry',
      makeModel: vehicleData.makeModel || vehicleData.vehicleType || 'Lorry',
      capacity: Number(vehicleData.capacity) || 1000,
      capacityUnit: vehicleData.capacityUnit || 'kg',
      availability: vehicleData.availability || 'Available',
      maintenanceStatus: vehicleData.maintenanceStatus || 'Good',
      notes: vehicleData.notes || '',
      currentAssignment: vehicleData.currentAssignment || 'None',
      image: finalImageUrl || vehicleData.image || null,
      driverUid: activeUid,
      assignedDriverId: activeUid,
      createdBy: activeUid,
      isActive: vehicleData.isActive || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const vehiclesRef = collection(db, 'vehicles');
    const docRef = await addDoc(vehiclesRef, payload);
    return { success: true, id: docRef.id, vehicle: { id: docRef.id, ...payload } };
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
    if (!vehicleId) return { success: false, error: 'Vehicle ID is required for update.' };
    const activeUid = driverUid || auth.currentUser?.uid;
    let finalImageUrl = vehicleData.image || null;
    if (
      finalImageUrl &&
      typeof finalImageUrl === 'string' &&
      !finalImageUrl.startsWith('http://') &&
      !finalImageUrl.startsWith('https://') &&
      !finalImageUrl.startsWith('data:image')
    ) {
      finalImageUrl = await uploadProduceImage(finalImageUrl, vehicleId);
    }

    const payload = cleanFirestorePayload({
      ...vehicleData,
      ...(vehicleData.plateNumber || vehicleData.vehicleNumber
        ? {
          plateNumber: (vehicleData.plateNumber || vehicleData.vehicleNumber || '').toUpperCase(),
          vehicleNumber: (vehicleData.vehicleNumber || vehicleData.plateNumber || '').toUpperCase(),
        }
        : {}),
      ...(vehicleData.capacity !== undefined ? { capacity: Number(vehicleData.capacity) || 0 } : {}),
      ...(finalImageUrl ? { image: finalImageUrl } : {}),
      ...(activeUid ? { driverUid: activeUid } : {}),
      updatedAt: serverTimestamp(),
    });

    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleDocRef, payload);
    return { success: true, vehicle: { id: vehicleId, ...payload } };
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
    if (!vehicleId) return { success: false, error: 'Vehicle ID is required for deletion.' };
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
    const activeUid = driverUid || auth.currentUser?.uid;
    const vehiclesRef = collection(db, 'vehicles');
    const snapshot = await getDocs(vehiclesRef);

    for (const d of snapshot.docs) {
      const data = d.data();
      const isTarget = d.id === vehicleId;
      if (!activeUid || data.driverUid === activeUid || data.assignedDriverId === activeUid || data.createdBy === activeUid || !data.driverUid) {
        await updateDoc(doc(db, 'vehicles', d.id), {
          isActive: isTarget,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (vehicleId) {
      const activeDocSnap = await getDoc(doc(db, 'vehicles', vehicleId));
      if (activeDocSnap.exists() && activeUid) {
        const activeData = activeDocSnap.data();
        await updateDoc(doc(db, 'users', activeUid), {
          vehicleNumber: activeData.plateNumber || activeData.vehicleNumber || '',
          vehicleType: activeData.vehicleType || '',
          vehicle: activeData,
          updatedAt: serverTimestamp(),
        }).catch(() => { });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting active driver vehicle:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// BUYER-SPECIFIC SUBSCRIPTIONS & MUTATIONS
// -------------------------------------------------------

/**
 * Real-time listener for orders belonging to a specific buyer
 */
export const subscribeToBuyerOrders = (buyerUid, onUpdate) => {
  if (!buyerUid) {
    onUpdate([]);
    return () => { };
  }
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('buyerId', '==', buyerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(orders);
    },
    (error) => {
      console.warn('Buyer orders subscription error:', error);
      onSnapshot(
        collection(db, 'orders'),
        (snap) => {
          const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          onUpdate(all.filter((o) => o.buyerId === buyerUid || o.buyerUid === buyerUid));
        },
        (err2) => {
          console.warn('Buyer orders fallback error:', err2);
          onUpdate([]);
        }
      );
    }
  );
};

/**
 * Real-time listener for a buyer's notifications (newest first)
 */
export const subscribeToBuyerNotifications = (buyerUid, onUpdate) => {
  if (!buyerUid) {
    onUpdate([]);
    return () => { };
  }
  const notifsRef = collection(db, 'notifications');
  const q = query(notifsRef, where('targetUid', '==', buyerUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      onUpdate(items);
    },
    (error) => {
      console.warn('Buyer notifications subscription error:', error?.message || error);
      onUpdate([]);
    }
  );
};

/**
 * Create a notification targeting a buyer
 */
export const createBuyerNotification = async (buyerUid, notifData) => {
  try {
    if (!buyerUid) return { success: false, error: 'buyerUid required' };
    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      targetUid: buyerUid,
      type: notifData.type || 'INFO',
      title: notifData.title || 'Notification',
      body: notifData.body || '',
      read: false,
      orderId: notifData.orderId || null,
      requestId: notifData.requestId || null,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.warn('Error creating buyer notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all unread buyer notifications as read
 */
export const markBuyerNotificationsRead = async (buyerUid) => {
  try {
    if (!buyerUid) return;
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('targetUid', '==', buyerUid), where('read', '==', false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch (error) {
    console.warn('Error marking buyer notifications read:', error);
  }
};

/**
 * Update an editable buyer custom request (status must be OPEN / PENDING)
 */
export const updateBuyerRequest = async (requestId, updatedData) => {
  try {
    if (!requestId) return { success: false, error: 'Request ID is required.' };
    const reqDocRef = doc(db, 'buyerRequests', requestId);
    await updateDoc(reqDocRef, { ...updatedData, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error updating buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a buyer custom request (status OPEN or PENDING only)
 */
export const cancelBuyerRequest = async (requestId, reason = '') => {
  try {
    if (!requestId) return { success: false, error: 'Request ID is required.' };
    const reqDocRef = doc(db, 'buyerRequests', requestId);
    await updateDoc(reqDocRef, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error cancelling buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Place an order and atomically reduce produce stock.
 * Falls back to a simple addDoc if produceId is missing.
 */
export const placeOrderWithStockReduction = async (orderPayload) => {
  try {
    const { runTransaction } = require('firebase/firestore');
    const produceId = orderPayload.produceId;
    const requestedQty = Number(orderPayload.qty) || 1;
    let newOrderId = null;

    if (produceId) {
      const produceDocRef = doc(db, 'produce', produceId);
      await runTransaction(db, async (transaction) => {
        const produceSnap = await transaction.get(produceDocRef);
        if (!produceSnap.exists()) throw new Error('Produce listing not found.');
        const currentStock = Number(produceSnap.data().stockQty) || 0;
        if (currentStock < requestedQty) {
          throw new Error(
            `Only ${currentStock} ${produceSnap.data().unitEn || 'units'} available. Requested: ${requestedQty}.`
          );
        }
        const newOrderRef = doc(collection(db, 'orders'));
        newOrderId = newOrderRef.id;
        transaction.set(newOrderRef, {
          ...orderPayload,
          status: 'PENDING',
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
          transportStatus: 'PENDING_TRANSPORT',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.update(produceDocRef, {
          stockQty: currentStock - requestedQty,
          updatedAt: serverTimestamp(),
        });
      });
    } else {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderPayload,
        status: 'PENDING',
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        transportStatus: 'PENDING_TRANSPORT',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newOrderId = docRef.id;
    }

    // Notify the farmer
    if (orderPayload.farmerId) {
      await createFarmerNotification(orderPayload.farmerId, {
        type: 'NEW_ORDER',
        title: '🛒 New Order Received',
        body: `${orderPayload.buyerName || 'A buyer'} ordered ${requestedQty} ${orderPayload.unit || 'kg'} of ${orderPayload.produceName || 'your produce'}.`,
        orderId: newOrderId,
      });
    }

    return { success: true, id: newOrderId };
  } catch (error) {
    console.error('Error placing order with stock reduction:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// COOPERATIVE ADMIN LOGISTICS TRANSACTIONS & MANAGEMENT
// -------------------------------------------------------

/**
 * Real-time listener for ALL transport requests across the system (for Admin Dashboard)
 */
export const subscribeToAllTransportRequests = (onUpdate) => {
  const transportRef = collection(db, 'transportRequests');
  return onSnapshot(
    transportRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(items);
    },
    (error) => {
      console.warn('All transport requests subscription error:', error);
      onUpdate([]);
    }
  );
};

/**
 * Create a notification for a Driver
 */
export const createDriverNotification = async (driverUid, notifData) => {
  try {
    if (!driverUid) return;
    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      targetUid: driverUid,
      type: notifData.type || 'INFO',
      title: notifData.title || 'Notification',
      body: notifData.body || '',
      read: false,
      orderId: notifData.orderId || null,
      requestId: notifData.requestId || null,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Error creating driver notification:', e);
  }
};

/**
 * Atomic transaction to assign Driver & Vehicle to a Transport Request / Order.
 * Updates transportRequest, order, driver user profile, vehicle document, and creates notifications for Driver, Farmer, Buyer.
 */
export const assignDriverAndVehicleTransaction = async ({
  transportRequestId,
  orderId,
  driver,
  vehicle,
}) => {
  try {
    if (!driver || (!driver.uid && !driver.id)) {
      return { success: false, error: 'Driver selection is required.' };
    }

    const batch = writeBatch(db);
    const driverUid = driver.uid || driver.id;
    const vehicleId = vehicle?.id || null;
    const vehiclePlate = vehicle?.plateNumber || vehicle?.vehicleNumber || driver?.vehicleNumber || 'Coop Truck';
    const vehicleTitle = vehicle?.title || vehicle?.makeModel || vehicle?.vehicleType || 'Lorry';

    // 1. Update Transport Request document if provided
    if (transportRequestId) {
      const reqRef = doc(db, 'transportRequests', transportRequestId);
      batch.update(reqRef, {
        driverId: driverUid,
        driverName: driver.fullName || 'Assigned Driver',
        driverPhone: driver.phoneNumber || '',
        vehicleId: vehicleId,
        vehicleNumber: vehiclePlate,
        vehicleType: vehicleTitle,
        status: 'ASSIGNED',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Update Order document if provided
    if (orderId) {
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, {
        driverId: driverUid,
        driverName: driver.fullName || 'Assigned Driver',
        driverPhone: driver.phoneNumber || '',
        vehicleId: vehicleId,
        vehicleNumber: vehiclePlate,
        vehicleType: vehicleTitle,
        status: 'IN_TRANSIT',
        transportStatus: 'ASSIGNED',
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Update Driver User document
    const driverUserRef = doc(db, 'users', driverUid);
    batch.set(
      driverUserRef,
      {
        status: 'ASSIGNED',
        availability: 'BUSY',
        currentAssignment: cleanFirestorePayload({
          orderId: orderId || '',
          transportRequestId: transportRequestId || '',
          assignedAt: new Date().toISOString(),
          vehicleNumber: vehiclePlate,
        }),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Update Vehicle document if provided
    if (vehicleId) {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      batch.update(vehicleRef, {
        status: 'ASSIGNED',
        availability: 'Assigned',
        assignedDriverId: driverUid,
        driverName: driver.fullName || '',
        currentAssignment: cleanFirestorePayload({
          orderId: orderId || '',
          transportRequestId: transportRequestId || '',
          assignedAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Commit Batch
    await batch.commit();

    // 6. Create Notifications
    createDriverNotification(driverUid, {
      type: 'ASSIGNMENT',
      title: '🚛 New Delivery Assignment',
      body: `You have been assigned to transport shipment #${orderId || transportRequestId || 'GL-100'}. Vehicle: ${vehiclePlate}.`,
      orderId: orderId || null,
      requestId: transportRequestId || null,
    });

    if (driver.farmerId) {
      createFarmerNotification(driver.farmerId, {
        type: 'TRANSPORT_ASSIGNED',
        title: '🚛 Driver & Vehicle Assigned',
        body: `Driver ${driver.fullName} (${vehiclePlate}) has been assigned to pick up your harvest.`,
        orderId: orderId || null,
      });
    }

    if (driver.buyerId) {
      createBuyerNotification(driver.buyerId, {
        type: 'TRANSPORT_ASSIGNED',
        title: '🚚 Order En Route',
        body: `Driver ${driver.fullName} (${vehiclePlate}) is en route to deliver your order.`,
        orderId: orderId || null,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in assignDriverAndVehicleTransaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Atomic transaction to complete a delivery and release driver + vehicle
 */
export const completeDeliveryTransaction = async ({
  orderId,
  transportRequestId,
  driverId,
  vehicleId,
  farmerId,
  buyerId,
}) => {
  try {
    const batch = writeBatch(db);

    // 1. Update Order
    if (orderId) {
      const orderRef = doc(db, 'orders', orderId);
      batch.update(orderRef, {
        status: 'DELIVERED',
        orderStatus: 'DELIVERED',
        transportStatus: 'COMPLETED',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Update Transport Request
    if (transportRequestId) {
      const reqRef = doc(db, 'transportRequests', transportRequestId);
      batch.update(reqRef, {
        status: 'COMPLETED',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Release Driver
    if (driverId) {
      const driverRef = doc(db, 'users', driverId);
      batch.set(
        driverRef,
        {
          status: 'AVAILABLE',
          availability: 'AVAILABLE',
          currentAssignment: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 4. Release Vehicle
    if (vehicleId) {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      batch.update(vehicleRef, {
        status: 'AVAILABLE',
        availability: 'AVAILABLE',
        currentAssignment: null,
        assignedDriverId: null,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    // Send notifications
    if (driverId) {
      createDriverNotification(driverId, {
        type: 'DELIVERY_COMPLETED',
        title: '🎉 Delivery Completed',
        body: `Shipment #${orderId || 'Order'} has been marked as delivered. You are now available for new assignments.`,
      });
    }
    if (farmerId) {
      createFarmerNotification(farmerId, {
        type: 'DELIVERY_COMPLETED',
        title: '✅ Shipment Delivered',
        body: `Your produce shipment #${orderId || 'Order'} has been successfully delivered to the buyer.`,
      });
    }
    if (buyerId) {
      createBuyerNotification(buyerId, {
        type: 'DELIVERY_COMPLETED',
        title: '📦 Order Delivered',
        body: `Your order #${orderId || 'Order'} has been delivered. Thank you for using GoviLink!`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing delivery transaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a vehicle with safety guard (prevents deleting if assigned to active delivery)
 */
export const deleteVehicleWithGuard = async (vehicleId, currentStatus, availability) => {
  try {
    if (!vehicleId) return { success: false, error: 'Vehicle ID is required.' };

    const statusUpper = (currentStatus || '').toUpperCase();
    const availUpper = (availability || '').toUpperCase();

    if (statusUpper === 'ASSIGNED' || availUpper === 'ASSIGNED' || statusUpper === 'IN_TRANSIT') {
      return {
        success: false,
        error: 'Cannot delete vehicle while it is assigned to an active delivery.',
      };
    }

    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(vehicleDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update Driver Status/Availability by Admin
 */
export const updateDriverStatusByAdmin = async (driverUid, newStatus) => {
  try {
    if (!driverUid) return { success: false, error: 'Driver UID is required.' };
    const isAvailable = newStatus === 'AVAILABLE';
    const driverDocRef = doc(db, 'users', driverUid);
    await setDoc(
      driverDocRef,
      {
        status: newStatus,
        availability: isAvailable ? 'AVAILABLE' : 'BUSY',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating driver status:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// DRIVER DELIVERY FLOW & STATUS TRANSITION VALIDATION
// -------------------------------------------------------

/**
 * Validate status transition sequence for Driver delivery flow
 */
const ALLOWED_STATUS_FLOW = {
  PENDING: ['ASSIGNED', 'ACCEPTED'],
  ASSIGNED: ['ACCEPTED', 'AT_PICKUP', 'CANCELLED'],
  ACCEPTED: ['AT_PICKUP', 'PICKUP_CONFIRMED', 'IN_TRANSIT'],
  AT_PICKUP: ['PICKUP_CONFIRMED', 'IN_TRANSIT'],
  PICKUP_CONFIRMED: ['IN_TRANSIT', 'ARRIVED'],
  IN_TRANSIT: ['ARRIVED', 'DELIVERED', 'COMPLETED'],
  ARRIVED: ['DELIVERED', 'COMPLETED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const isValidStatusTransition = (currentStatus, newStatus) => {
  const curr = (currentStatus || 'ASSIGNED').toUpperCase();
  const next = (newStatus || '').toUpperCase();
  if (curr === next) return true; // Idempotent updates allowed
  const allowedNext = ALLOWED_STATUS_FLOW[curr] || [];
  return allowedNext.includes(next);
};

/**
 * Helper to upload image (Proof of delivery / Cargo photo) to Storage
 */
export const uploadImageToFirebaseStorage = async (uri, path) => {
  if (!uri || typeof uri !== 'string') return null;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;

  try {
    const storageRef = ref(storage, path);
    if (uri.startsWith('data:')) {
      await uploadString(storageRef, uri, 'data_url');
    } else {
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    }
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.warn('Storage upload error, using raw URI:', error);
    return uri;
  }
};

/**
 * Helper to create admin notifications
 */
export const createAdminNotification = async (notifData) => {
  try {
    const notifsRef = collection(db, 'notifications');
    await addDoc(notifsRef, {
      targetRole: 'admin',
      type: notifData.type || 'INFO',
      title: notifData.title || 'Notification',
      body: notifData.body || '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Error creating admin notification:', e);
  }
};

/**
 * Universal Order Status Update function with atomic batch write & status sequence validation.
 */
export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  try {
    if (!orderId) return { success: false, error: 'Order ID is required.' };
    const nextStatusUpper = (newStatus || '').toUpperCase();

    // 1. Fetch current order document to validate transition sequence
    const orderDocRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderDocRef);
    let currentStatus = 'ASSIGNED';
    let orderData = {};

    if (orderSnap.exists()) {
      orderData = orderSnap.data();
      currentStatus = (orderData.status || orderData.orderStatus || 'ASSIGNED').toUpperCase();
    }

    // Validate transition
    if (!isValidStatusTransition(currentStatus, nextStatusUpper)) {
      return {
        success: false,
        error: `Invalid status transition from "${currentStatus}" to "${nextStatusUpper}". Sequence must be: Assigned -> Accepted -> Pickup Confirmed -> In Transit -> Arrived -> Delivered.`,
      };
    }

    // Handle Proof Photo upload if provided in extraData
    let proofPhotoUrl = extraData.proofPhoto || extraData.pickupPhoto || null;
    if (
      proofPhotoUrl &&
      typeof proofPhotoUrl === 'string' &&
      !proofPhotoUrl.startsWith('http://') &&
      !proofPhotoUrl.startsWith('https://')
    ) {
      proofPhotoUrl = await uploadImageToFirebaseStorage(
        proofPhotoUrl,
        `proofs/delivery_${orderId}_${Date.now()}.jpg`
      );
    }

    const batch = writeBatch(db);
    const nowStamp = serverTimestamp();

    // Build update payload for Order document
    const orderPayload = cleanFirestorePayload({
      status: nextStatusUpper,
      orderStatus: nextStatusUpper,
      ...(nextStatusUpper === 'ACCEPTED' ? { acceptedAt: nowStamp } : {}),
      ...(nextStatusUpper === 'PICKUP_CONFIRMED' || nextStatusUpper === 'AT_PICKUP'
        ? { pickupConfirmedAt: nowStamp, pickupNotes: extraData.pickupNotes || '' }
        : {}),
      ...(nextStatusUpper === 'IN_TRANSIT' ? { transportStatus: 'IN_TRANSIT', startedDeliveryAt: nowStamp } : {}),
      ...(nextStatusUpper === 'DELIVERED' || nextStatusUpper === 'COMPLETED'
        ? {
          transportStatus: 'COMPLETED',
          deliveredAt: nowStamp,
          completedAt: nowStamp,
          receiverName: extraData.receiverName || '',
          proofNotes: extraData.proofNotes || '',
          proofPhoto: proofPhotoUrl,
        }
        : {}),
      ...(proofPhotoUrl ? { proofPhoto: proofPhotoUrl } : {}),
      updatedAt: nowStamp,
    });

    batch.update(orderDocRef, orderPayload);

    // Update corresponding Transport Request document if requestId present
    const reqId = orderData.requestId || orderData.transportRequestId || extraData.requestId;
    if (reqId) {
      const reqDocRef = doc(db, 'transportRequests', reqId);
      const reqPayload = cleanFirestorePayload({
        status: nextStatusUpper === 'DELIVERED' ? 'COMPLETED' : nextStatusUpper,
        ...(nextStatusUpper === 'ACCEPTED' ? { acceptedAt: nowStamp } : {}),
        ...(nextStatusUpper === 'IN_TRANSIT' ? { startedDeliveryAt: nowStamp } : {}),
        ...(nextStatusUpper === 'DELIVERED' || nextStatusUpper === 'COMPLETED'
          ? { completedAt: nowStamp, proofPhoto: proofPhotoUrl }
          : {}),
        updatedAt: nowStamp,
      });
      batch.update(reqDocRef, reqPayload);
    }

    // If delivered or completed, release driver & vehicle availability atomically
    const driverId = orderData.driverId || extraData.driverId || auth.currentUser?.uid;
    const vehicleId = orderData.vehicleId || extraData.vehicleId;

    if ((nextStatusUpper === 'DELIVERED' || nextStatusUpper === 'COMPLETED') && driverId) {
      const driverRef = doc(db, 'users', driverId);
      batch.set(
        driverRef,
        {
          status: 'AVAILABLE',
          availability: 'AVAILABLE',
          currentAssignment: null,
          updatedAt: nowStamp,
        },
        { merge: true }
      );

      if (vehicleId) {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        batch.update(vehicleRef, {
          status: 'AVAILABLE',
          availability: 'AVAILABLE',
          currentAssignment: null,
          assignedDriverId: null,
          updatedAt: nowStamp,
        });
      }
    }

    await batch.commit();

    // Trigger status notifications for Farmer, Buyer, Admin
    const farmerId = orderData.farmerId;
    const buyerId = orderData.buyerId || orderData.buyerUid;
    const driverName = extraData.driverName || orderData.driverName || 'Driver';

    if (nextStatusUpper === 'ACCEPTED') {
      createAdminNotification({
        type: 'ASSIGNMENT_ACCEPTED',
        title: '📦 Assignment Accepted',
        body: `Driver ${driverName} accepted transport for order #${orderData.orderNo || orderId}.`,
      });
    } else if (nextStatusUpper === 'PICKUP_CONFIRMED' || nextStatusUpper === 'AT_PICKUP') {
      if (farmerId) {
        createFarmerNotification(farmerId, {
          type: 'PICKUP_CONFIRMED',
          title: '🌾 Cargo Pickup Confirmed',
          body: `Driver ${driverName} has picked up cargo for order #${orderData.orderNo || orderId}.`,
        });
      }
      if (buyerId) {
        createBuyerNotification(buyerId, {
          type: 'PICKUP_CONFIRMED',
          title: '🚜 Cargo Picked Up',
          body: `Driver ${driverName} verified harvest pickup from farm.`,
        });
      }
    } else if (nextStatusUpper === 'IN_TRANSIT') {
      if (buyerId) {
        createBuyerNotification(buyerId, {
          type: 'IN_TRANSIT',
          title: '🚚 Order In Transit',
          body: `Driver ${driverName} has started delivery for your order #${orderData.orderNo || orderId}.`,
        });
      }
    } else if (nextStatusUpper === 'DELIVERED' || nextStatusUpper === 'COMPLETED') {
      if (farmerId) {
        createFarmerNotification(farmerId, {
          type: 'DELIVERY_COMPLETED',
          title: '✅ Delivery Completed',
          body: `Order #${orderData.orderNo || orderId} has been delivered to ${extraData.receiverName || 'the buyer'}.`,
        });
      }
      if (buyerId) {
        createBuyerNotification(buyerId, {
          type: 'DELIVERY_COMPLETED',
          title: '🎉 Order Delivered',
          body: `Your order #${orderData.orderNo || orderId} has been successfully delivered.`,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return { success: false, error: error.message };
  }
};


