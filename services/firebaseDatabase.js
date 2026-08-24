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
// DRIVER VEHICLE MANAGEMENT
// -------------------------------------------------------

/**
 * Upload vehicle image to Firebase Storage with base64 / data URL fallback
 */
export const uploadVehicleImage = async (imageUri, driverUid) => {
  if (!imageUri) return null;

  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }

  const uniqueId = driverUid ? `vehicle_${driverUid}_${Date.now()}` : `vehicle_${Date.now()}`;
  const storagePath = `vehicle_images/${uniqueId}.jpg`;
  const storageRef = ref(storage, storagePath);

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
    console.warn('Firebase Storage vehicle upload warning, fallback to data URL:', storageError);
    if (imageUri.startsWith('data:')) {
      return imageUri;
    }
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
      console.error('Failed to convert vehicle image:', fallbackError);
      return imageUri;
    }
  }
};

/**
 * Real-time listener for all vehicles owned by a driver
 */
export const subscribeToDriverVehicles = (driverUid, onUpdate) => {
  if (!driverUid) {
    if (typeof onUpdate === 'function') onUpdate([]);
    return () => {};
  }

  try {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('driverUid', '==', driverUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const vehicles = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          if (typeof onUpdate === 'function') onUpdate(vehicles);
        } catch (mapErr) {
          console.warn('Error mapping vehicles:', mapErr);
        }
      },
      (error) => {
        console.warn('Firestore driver vehicles subscription warning:', error);
      }
    );

    return typeof unsubscribe === 'function' ? unsubscribe : () => {};
  } catch (e) {
    console.warn('subscribeToDriverVehicles exception:', e);
    return () => {};
  }
};

/**
 * Add a new vehicle to the driver's fleet
 */
export const addDriverVehicle = async (driverUid, vehicleData) => {
  if (!driverUid) return { success: false, error: 'Driver UID is required.' };

  try {
    let finalImageUrl = vehicleData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadVehicleImage(finalImageUrl, driverUid);
    }

    // Check existing vehicles to decide if this should be default active
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('driverUid', '==', driverUid));
    const snap = await getDocs(q);
    const isFirstVehicle = snap.empty;
    const isActive = vehicleData.isActive !== undefined ? vehicleData.isActive : isFirstVehicle;

    // If setting active, deactivate existing vehicles
    if (isActive && !isFirstVehicle) {
      for (const docSnap of snap.docs) {
        if (docSnap.data().isActive) {
          await updateDoc(doc(db, 'vehicles', docSnap.id), { isActive: false });
        }
      }
    }

    const payload = {
      ...vehicleData,
      image: finalImageUrl || vehicleData.image || null,
      driverUid,
      isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(vehiclesRef, payload);
    const createdVehicle = { id: docRef.id, ...payload };

    // If active, sync to user profile for quick dashboard access
    if (isActive) {
      const userDocRef = doc(db, 'users', driverUid);
      await updateDoc(userDocRef, {
        vehicle: createdVehicle,
        activeVehicleId: docRef.id,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true, id: docRef.id, vehicle: createdVehicle };
  } catch (error) {
    console.error('Error adding driver vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing vehicle in driver's fleet
 */
export const updateDriverVehicle = async (vehicleId, vehicleData, driverUid) => {
  if (!vehicleId) return { success: false, error: 'Vehicle ID is required.' };

  try {
    let finalImageUrl = vehicleData.image;
    if (finalImageUrl && !finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
      finalImageUrl = await uploadVehicleImage(finalImageUrl, driverUid);
    }

    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    const updatedPayload = {
      ...vehicleData,
      image: finalImageUrl || vehicleData.image || null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(vehicleDocRef, updatedPayload);

    // If this vehicle is marked active or currently the active vehicle, sync with user profile
    if (driverUid && (vehicleData.isActive || vehicleData.isCurrentlyActive)) {
      const userDocRef = doc(db, 'users', driverUid);
      await updateDoc(userDocRef, {
        vehicle: { id: vehicleId, ...updatedPayload },
        activeVehicleId: vehicleId,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true, vehicle: { id: vehicleId, ...updatedPayload } };
  } catch (error) {
    console.error('Error updating driver vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a vehicle from driver's fleet
 */
export const deleteDriverVehicle = async (vehicleId, driverUid) => {
  if (!vehicleId) return { success: false, error: 'Vehicle ID is required.' };

  try {
    const vehicleDocRef = doc(db, 'vehicles', vehicleId);
    const vehicleSnap = await getDoc(vehicleDocRef);
    const wasActive = vehicleSnap.exists() ? vehicleSnap.data().isActive : false;

    await deleteDoc(vehicleDocRef);

    // If the deleted vehicle was active, select another vehicle as active
    if (wasActive && driverUid) {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, where('driverUid', '==', driverUid));
      const remainingSnap = await getDocs(q);

      if (!remainingSnap.empty) {
        const nextActiveDoc = remainingSnap.docs[0];
        await updateDoc(doc(db, 'vehicles', nextActiveDoc.id), { isActive: true });
        await updateDoc(doc(db, 'users', driverUid), {
          vehicle: { id: nextActiveDoc.id, ...nextActiveDoc.data(), isActive: true },
          activeVehicleId: nextActiveDoc.id,
          updatedAt: serverTimestamp(),
        });
      } else {
        // No vehicles remaining
        await updateDoc(doc(db, 'users', driverUid), {
          vehicle: null,
          activeVehicleId: null,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting driver vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set a vehicle as the currently active dispatch vehicle for driver
 */
export const setActiveDriverVehicle = async (driverUid, vehicleId) => {
  if (!driverUid || !vehicleId) return { success: false, error: 'Driver UID and Vehicle ID are required.' };

  try {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('driverUid', '==', driverUid));
    const snap = await getDocs(q);

    let activeVehicleData = null;

    for (const docSnap of snap.docs) {
      if (docSnap.id === vehicleId) {
        await updateDoc(doc(db, 'vehicles', docSnap.id), { isActive: true, updatedAt: serverTimestamp() });
        activeVehicleData = { id: docSnap.id, ...docSnap.data(), isActive: true };
      } else if (docSnap.data().isActive) {
        await updateDoc(doc(db, 'vehicles', docSnap.id), { isActive: false, updatedAt: serverTimestamp() });
      }
    }

    if (activeVehicleData) {
      const userDocRef = doc(db, 'users', driverUid);
      await updateDoc(userDocRef, {
        vehicle: activeVehicleData,
        activeVehicleId: vehicleId,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true, vehicle: activeVehicleData };
  } catch (error) {
    console.error('Error setting active vehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Legacy wrapper: Save or update driver vehicle in Firestore
 */
export const saveDriverVehicle = async (driverUid, vehicleData) => {
  if (vehicleData.id) {
    return updateDriverVehicle(vehicleData.id, vehicleData, driverUid);
  }
  return addDriverVehicle(driverUid, vehicleData);
};


