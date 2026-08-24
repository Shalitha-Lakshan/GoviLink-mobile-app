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
// BUYER CUSTOM PRODUCE REQUESTS (SPECIFIC AREA & DATE)
// -------------------------------------------------------

/**
 * Submit a custom produce request from a buyer
 */
export const createBuyerCustomRequest = async (requestData) => {
  try {
    const requestsRef = collection(db, 'buyer_requests');
    const docRef = await addDoc(requestsRef, {
      ...requestData,
      status: 'OPEN',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating buyer custom request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for Buyer Custom Requests in Firestore
 */
export const subscribeToBuyerRequests = (onUpdate, buyerUid = null) => {
  const requestsRef = collection(db, 'buyer_requests');

  return onSnapshot(requestsRef, (snapshot) => {
    let requests = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    if (buyerUid) {
      requests = requests.filter((r) => r.buyerUid === buyerUid);
    }

    // Sort newest first
    requests.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    onUpdate(requests);
  }, (error) => {
    console.error('Firestore buyer requests subscription error:', error);
  });
};

/**
 * Delete or cancel a buyer custom request
 */
export const deleteBuyerRequest = async (requestId) => {
  try {
    const requestDocRef = doc(db, 'buyer_requests', requestId);
    await deleteDoc(requestDocRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting buyer request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Accept a buyer custom request by a farmer ("I'll Provide")
 */
export const acceptBuyerCustomRequest = async (requestData, farmerProfile) => {
  try {
    const requestId = requestData.id;
    // 1. Update the buyer_requests doc
    const requestDocRef = doc(db, 'buyer_requests', requestId);
    await updateDoc(requestDocRef, {
      status: 'ACCEPTED',
      farmerUid: farmerProfile?.uid || '',
      farmerName: farmerProfile?.fullName || 'Registered Farmer',
      farmerPhone: farmerProfile?.phoneNumber || '',
      farmerDistrict: farmerProfile?.district?.nameEn || '',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Create an associated Order in Firestore orders collection so both parties & drivers track it
    const unitPrice = Number(requestData.targetPricePerUnit) || 0;
    const qty = Number(requestData.quantity) || 1;
    const subtotal = unitPrice * qty;
    const logisticsFee = requestData.deliveryNeeded !== false ? 350 : 0;
    const totalPrice = subtotal + logisticsFee;

    const orderPayload = {
      customRequestId: requestId,
      produceName: requestData.cropName || 'Custom Harvest Order',
      category: requestData.category || 'Vegetables',
      qty: qty,
      unit: requestData.unit || 'kg',
      unitPrice: unitPrice,
      subtotal: subtotal,
      logisticsFee: logisticsFee,
      totalPrice: totalPrice,
      farmerName: farmerProfile?.fullName || 'Registered Farmer',
      farmerId: farmerProfile?.uid || '',
      farmerPhone: farmerProfile?.phoneNumber || '',
      pickupLocation: farmerProfile?.district?.nameEn || requestData.targetDistrictName || 'Farm Origin',
      buyerName: requestData.buyerName || 'Buyer',
      buyerPhone: requestData.buyerPhone || '',
      buyerUid: requestData.buyerUid || '',
      deliveryAddress: requestData.deliveryAddress || 'Self-Pickup',
      deliveryNeeded: requestData.deliveryNeeded !== false,
      datePeriod: requestData.datePeriodDescription || `${requestData.requiredDateStart} to ${requestData.requiredDateEnd}`,
      qualityGrade: requestData.qualityGrade || 'Grade A',
      notes: requestData.notes || '',
      isCustomRequest: true,
      status: 'ACCEPTED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ordersRef = collection(db, 'orders');
    const orderDocRef = await addDoc(ordersRef, orderPayload);

    return { success: true, orderId: orderDocRef.id };
  } catch (error) {
    console.error('Error accepting buyer custom request:', error);
    return { success: false, error: error.message };
  }
};

// -------------------------------------------------------
// DRIVER FLEET & ASSIGNMENT MANAGEMENT
// -------------------------------------------------------

export const DEFAULT_COOP_DRIVERS = [
  {
    id: 'driver_default_1',
    uid: 'driver_default_1',
    fullName: 'Ruwan Perera',
    phoneNumber: '077-1234567',
    email: 'ruwan.driver@govilink.lk',
    role: 'driver',
    vehicleNumber: 'WP LH-4592 (4T Refrigerated Lorry)',
    vehicleType: 'Refrigerated Truck',
    district: { nameEn: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
    rating: '4.9 ★',
    tripsCompleted: 142,
  },
  {
    id: 'driver_default_2',
    uid: 'driver_default_2',
    fullName: 'Kamal Silva',
    phoneNumber: '071-9876543',
    email: 'kamal.driver@govilink.lk',
    role: 'driver',
    vehicleNumber: 'CP ND-8812 (Dimo Batta 1.5T)',
    vehicleType: 'Light Cargo Truck',
    district: { nameEn: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' },
    rating: '4.8 ★',
    tripsCompleted: 98,
  },
  {
    id: 'driver_default_3',
    uid: 'driver_default_3',
    fullName: 'Anura Bandara',
    phoneNumber: '076-5544332',
    email: 'anura.driver@govilink.lk',
    role: 'driver',
    vehicleNumber: 'NC LF-6231 (Isuzu ELF 3.5T)',
    vehicleType: 'Medium Ag-Carrier',
    district: { nameEn: 'Anuradhapura', nameSi: 'අනුරාධපුරය', nameTa: 'அனுராதபுரம்' },
    rating: '5.0 ★',
    tripsCompleted: 215,
  },
  {
    id: 'driver_default_4',
    uid: 'driver_default_4',
    fullName: 'Sunil Jayawardena',
    phoneNumber: '078-3322110',
    email: 'sunil.driver@govilink.lk',
    role: 'driver',
    vehicleNumber: 'NW PJ-1904 (Covered Canopy 2T)',
    vehicleType: 'Produce Carrier',
    district: { nameEn: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருநாகல்' },
    rating: '4.7 ★',
    tripsCompleted: 76,
  },
];

/**
 * Real-time listener for Registered Drivers in Firestore
 * Merges with default co-op fleet roster to ensure immediate availability.
 */
export const subscribeToDrivers = (onUpdate) => {
  const usersRef = collection(db, 'users');

  return onSnapshot(usersRef, (snapshot) => {
    const firestoreDrivers = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.role === 'driver') {
        firestoreDrivers.push({
          id: docSnap.id,
          uid: docSnap.id,
          fullName: data.fullName || 'Registered Driver',
          phoneNumber: data.phoneNumber || '0770000000',
          email: data.email || '',
          role: 'driver',
          vehicleNumber: data.vehicleNumber || 'Registered Transport Vehicle',
          vehicleType: data.vehicleType || 'Logistics Vehicle',
          district: data.district || { nameEn: 'Western Province', nameSi: 'බස්නාහිර', nameTa: 'மேற்கு' },
          rating: data.rating || '5.0 ★',
          tripsCompleted: data.tripsCompleted || 0,
        });
      }
    });

    // Merge: Put newly registered Firestore drivers first, then defaults that aren't duplicate
    const registeredIds = new Set(firestoreDrivers.map((d) => d.uid || d.id));
    const combined = [
      ...firestoreDrivers,
      ...DEFAULT_COOP_DRIVERS.filter((d) => !registeredIds.has(d.id)),
    ];

    onUpdate(combined);
  }, (error) => {
    console.error('Firestore drivers subscription error:', error);
    // Fallback to default co-op drivers on error
    onUpdate(DEFAULT_COOP_DRIVERS);
  });
};

/**
 * Determine driver availability against live orders list.
 * A driver is BUSY (unavailable) if assigned to any order that is NOT yet DELIVERED or CANCELLED.
 * Once confirmed as DELIVERED, the driver becomes available again.
 */
export const checkDriverAvailability = (driver, ordersList = []) => {
  if (!driver) return { isAvailable: true, activeOrder: null };

  const driverId = driver.uid || driver.id;
  const driverName = (driver.fullName || '').toLowerCase().trim();

  // Active statuses where driver is occupied
  const occupiedStatuses = ['READY_FOR_PICKUP', 'IN_TRANSIT', 'ASSIGNED', 'ACCEPTED', 'PENDING'];

  const activeOrder = ordersList.find((order) => {
    const isThisDriver =
      (order.driverId && order.driverId === driverId) ||
      (order.driverName && order.driverName.toLowerCase().trim() === driverName);

    if (!isThisDriver) return false;

    const status = (order.status || '').toUpperCase();
    // Driver is occupied if order is in progress and NOT delivered/cancelled
    return status !== 'DELIVERED' && status !== 'CANCELLED' && occupiedStatuses.includes(status);
  });

  if (activeOrder) {
    return {
      isAvailable: false,
      activeOrder,
      reason: `Assigned to: ${activeOrder.produceName || 'Order'} (${activeOrder.status || 'In Transit'})`,
    };
  }

  return { isAvailable: true, activeOrder: null };
};

/**
 * Manually assign a driver to an order
 */
export const assignDriverToOrder = async (orderId, driver) => {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const driverId = driver.uid || driver.id;
    const driverName = driver.fullName || 'Assigned Driver';
    const driverPhone = driver.phoneNumber || '';
    const driverVehicle = driver.vehicleNumber || 'GoviLink Transport Vehicle';

    await updateDoc(orderDocRef, {
      driverId: driverId,
      driverName: driverName,
      driverPhone: driverPhone,
      driverVehicle: driverVehicle,
      driverDistrict: driver.district?.nameEn || '',
      status: 'READY_FOR_PICKUP',
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error assigning driver to order:', error);
    return { success: false, error: error.message };
  }
};



