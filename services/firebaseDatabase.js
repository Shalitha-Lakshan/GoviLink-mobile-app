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
  runTransaction,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { db, auth, storage } from '../firebaseConfig';
import { uploadNativeImage } from './nativeImageUpload';

// -------------------------------------------------------
// PRODUCE LISTINGS & IMAGE UPLOADS
// -------------------------------------------------------

/**
 * Compress web images before embedding them in a shared Firestore document.
 */
const compressWebDataUrl = async (dataUrl, maxDim = 800, quality = 0.65) => {
  if (Platform.OS === 'web' && typeof Image !== 'undefined' && dataUrl && dataUrl.startsWith('data:image')) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch (_e) {
        resolve(dataUrl);
      }
    });
  }
  return dataUrl;
};

// Leave room for listing fields within Firestore's document size limit.
const MAX_INLINE_IMAGE_LENGTH = 700000;
const validateInlineImage = (value) => {
  if (typeof value !== 'string' || !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('Could not prepare a shareable photo. Please select the photo again.');
  }
  if (value.length > MAX_INLINE_IMAGE_LENGTH) {
    throw new Error('The photo is too large to save without image hosting. Please choose a smaller photo or try uploading again.');
  }
  return value;
};

const readImageDataUrl = async (uri) => {
  if (uri.startsWith('data:')) return uri;
  const response = await fetch(uri);
  if (response.ok === false) throw new Error('Could not read the selected photo.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Local file responses can omit the image MIME type on native.
      // Recover it from the encoded file signature rather than assuming JPEG.
      const value = reader.result;
      if (typeof value === 'string' && !value.startsWith('data:image/')) {
        const base64 = value.split(';base64,')[1];
        const mimeType = base64?.startsWith('/9j/') ? 'image/jpeg'
          : base64?.startsWith('iVBORw0KGgo') ? 'image/png'
            : base64?.startsWith('R0lGOD') ? 'image/gif' : null;
        if (mimeType) {
          resolve(`data:${mimeType};base64,${base64}`);
          return;
        }
      }
      resolve(value);
    };
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Upload produce image to Firebase Storage (with base64 fallback)
 * Return only a hosted URL or bounded, self-contained image data. Never persist
 * file/content/blob addresses, which are only accessible on the originating device.
 */
export const uploadProduceImage = async (imageUri, produceId) => {
  if (!imageUri) return null;

  // 1. If already a remote web URL, keep as is
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return imageUri;
  }

  // Web uses inline data for compatibility with the current bucket CORS setup.
  // Resolve blob URLs first: returning a browser object URL would break on other devices.
  if (Platform.OS === 'web') {
    const dataUrl = await readImageDataUrl(imageUri);
    return validateInlineImage(await compressWebDataUrl(dataUrl));
  }

  // 3. On Native (Android / iOS): Upload to Firebase Storage
  // Native mobile platforms use native sockets/HTTP and do NOT have browser CORS restrictions.
  // A new object for each replacement avoids stale cached images after editing.
  const uniqueId = `${produceId || 'produce'}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const storagePath = `produce_images/${uniqueId}.jpg`;
  const dataUrl = await readImageDataUrl(imageUri);

  try {
    return await uploadNativeImage(storage, auth, dataUrl, storagePath);
  } catch (storageError) {
    console.warn('Native Firebase Storage upload error, falling back:', storageError);
    try {
      return validateInlineImage(dataUrl);
    } catch (fallbackError) {
      throw new Error(fallbackError.message || 'Photo upload failed. Please select the photo again and retry.');
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
// ORDERS & DELIVERY STATUS WORKFLOW (GOVI-108 -> GOVI-116)
// -------------------------------------------------------

export const DELIVERY_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/**
 * Valid delivery status transitions matrix (GOVI-115, GOVI-146, GOVI-150)
 * PENDING -> ASSIGNED / ACCEPTED / PREPARING / READY_FOR_PICKUP -> IN_TRANSIT -> DELIVERED
 * DELIVERED and CANCELLED are terminal states (no further transitions allowed).
 */
export const VALID_DELIVERY_TRANSITIONS = {
  PENDING: ['ASSIGNED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
  READY_FOR_PICKUP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal: once delivered, cannot transition backwards!
  CANCELLED: [], // Terminal: once cancelled, cannot transition!
};

/**
 * Validates delivery status transition server-side (GOVI-115)
 */
export const isValidStatusTransition = (currentStatus, nextStatus) => {
  if (!nextStatus) return false;
  const current = (currentStatus || 'PENDING').toUpperCase();
  const next = nextStatus.toUpperCase();

  // Idempotent (same status)
  if (current === next) return true;

  const allowed = VALID_DELIVERY_TRANSITIONS[current];
  if (!allowed) {
    return ['PENDING', 'ASSIGNED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(next);
  }

  return allowed.includes(next);
};

/**
 * Trigger Delivery Notifications in Firestore (GOVI-114)
 */
export const triggerDeliveryNotification = async (orderId, order, newStatus, extraData = {}) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const nowIso = new Date().toISOString();
    const produceTitle = order.produceName || 'Produce Batch';
    const driverName = extraData.driverName || order.driverName || 'Kamal Perera';

    // 1. Notify Buyer
    const buyerNotification = {
      orderId,
      recipientUid: order.buyerUid || '',
      recipientRole: 'buyer',
      title: newStatus === 'IN_TRANSIT' ? 'Order In Transit 🚛' : 'Order Delivered! 🎉',
      message: newStatus === 'IN_TRANSIT'
        ? `Your order for ${produceTitle} is now on the way with driver ${driverName}.`
        : `Your order for ${produceTitle} has been delivered successfully to ${order.deliveryAddress || 'your address'}.`,
      status: newStatus,
      createdAt: serverTimestamp(),
      createdIso: nowIso,
      read: false,
    };
    await addDoc(notificationsRef, buyerNotification);

    // 2. Notify Farmer
    if (order.farmerId || order.farmerUid) {
      const farmerNotification = {
        orderId,
        recipientUid: order.farmerId || order.farmerUid,
        recipientRole: 'farmer',
        title: newStatus === 'IN_TRANSIT' ? 'Cargo Dispatched 🚛' : 'Order Delivered ✅',
        message: newStatus === 'IN_TRANSIT'
          ? `Cargo for ${produceTitle} was picked up by driver ${driverName} and is in transit.`
          : `Order for ${produceTitle} was delivered to buyer ${order.buyerName || 'Buyer'}.`,
        status: newStatus,
        createdAt: serverTimestamp(),
        createdIso: nowIso,
        read: false,
      };
      await addDoc(notificationsRef, farmerNotification);
    }
  } catch (notifyErr) {
    console.warn('Delivery notification trigger warning (non-fatal):', notifyErr);
  }
};

/**
 * Place a new Order in Firestore
 * Initializes status to PENDING and seeds initial statusHistory entry.
 */
export const placeOrderInFirestore = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const nowIso = new Date().toISOString();
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: nowIso,
          changedBy: orderData.buyerName || 'Buyer',
          actorRole: 'buyer',
          notes: 'Order placed by buyer',
        },
      ],
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error placing order in Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update order status with server-side transition validation (GOVI-109, GOVI-110, GOVI-111, GOVI-114, GOVI-115)
 *
 * @param {string} orderId
 * @param {string} newStatus ('ACCEPTED' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED')
 * @param {object} extraData
 */
export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }
  if (!newStatus) {
    return { success: false, error: 'Target status is required' };
  }

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const orderDocSnap = await getDoc(orderDocRef);

    if (!orderDocSnap.exists()) {
      return { success: false, error: 'Order not found in database' };
    }

    const currentOrder = orderDocSnap.data();
    const currentStatus = (currentOrder.status || 'PENDING').toUpperCase();
    const normalizedNewStatus = newStatus.toUpperCase();

    // 1. Terminal state checks (GOVI-110 & GOVI-115)
    if (currentStatus === 'DELIVERED') {
      return {
        success: false,
        error: 'Order has already been Delivered. Status cannot be modified backwards.',
      };
    }

    if (currentStatus === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot update status of a cancelled order.',
      };
    }

    // 2. Validate transition (GOVI-115)
    if (!isValidStatusTransition(currentStatus, normalizedNewStatus)) {
      return {
        success: false,
        error: `Invalid delivery status transition from ${currentStatus} to ${normalizedNewStatus}`,
      };
    }

    // 3. Prepare status timestamps & history (GOVI-111)
    const nowIso = new Date().toISOString();
    const updatePayload = {
      status: normalizedNewStatus,
      updatedAt: serverTimestamp(),
      ...extraData,
    };

    if (normalizedNewStatus === 'IN_TRANSIT') {
      updatePayload.inTransitAt = serverTimestamp();
      updatePayload.inTransitIso = nowIso;
    } else if (normalizedNewStatus === 'DELIVERED') {
      updatePayload.deliveredAt = serverTimestamp();
      updatePayload.deliveredIso = nowIso;
    } else if (normalizedNewStatus === 'READY_FOR_PICKUP' || normalizedNewStatus === 'PREPARING') {
      updatePayload.readyAt = serverTimestamp();
      updatePayload.readyIso = nowIso;
    } else if (normalizedNewStatus === 'ACCEPTED') {
      updatePayload.acceptedAt = serverTimestamp();
      updatePayload.acceptedIso = nowIso;
    }

    // Append to statusHistory cleanly (GOVI-111)
    const existingHistory = Array.isArray(currentOrder.statusHistory) ? currentOrder.statusHistory : [];
    const lastEntry = existingHistory[existingHistory.length - 1];
    if (!lastEntry || lastEntry.status !== normalizedNewStatus) {
      const historyEntry = {
        status: normalizedNewStatus,
        timestamp: nowIso,
        changedBy: extraData.changedBy || extraData.driverName || extraData.farmerName || 'Authorized User',
        actorRole: extraData.actorRole || (extraData.driverName ? 'driver' : (extraData.farmerName ? 'farmer' : 'admin')),
        notes: extraData.notes || extraData.specialNotes || '',
      };
      updatePayload.statusHistory = [...existingHistory, historyEntry];
    }

    await updateDoc(orderDocRef, updatePayload);

    // 3b. Sync assigned vehicle status in fleet
    const assignedVehId = currentOrder.vehicleId || currentOrder.driverVehicleId || updatePayload.vehicleId;
    if (assignedVehId) {
      try {
        const vehDocRef = doc(db, 'vehicles', assignedVehId);
        if (normalizedNewStatus === 'DELIVERED' || normalizedNewStatus === 'CANCELLED') {
          await updateDoc(vehDocRef, {
            status: 'AVAILABLE',
            currentOrderId: null,
            updatedAt: serverTimestamp(),
          });
        } else if (normalizedNewStatus === 'IN_TRANSIT') {
          await updateDoc(vehDocRef, {
            status: 'IN_USE',
            currentOrderId: orderId,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (_vehErr) {
        console.warn('Vehicle status sync warning (non-fatal):', _vehErr);
      }
    }

    // 4. Trigger Notifications (GOVI-114)
    if (normalizedNewStatus === 'IN_TRANSIT' || normalizedNewStatus === 'DELIVERED') {
      await triggerDeliveryNotification(orderId, currentOrder, normalizedNewStatus, extraData);
    }

    return {
      success: true,
      orderId,
      status: normalizedNewStatus,
      inTransitAt: updatePayload.inTransitIso,
      deliveredAt: updatePayload.deliveredIso,
    };
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for all Orders in Firestore
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

/**
 * Real-time listener for a single Order by ID (GOVI-112)
 */
export const subscribeToOrderById = (orderId, onUpdate) => {
  if (!orderId) return () => { };
  const orderDocRef = doc(db, 'orders', orderId);

  return onSnapshot(orderDocRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() });
    }
  }, (error) => {
    console.error('Error subscribing to order by ID:', error);
  });
};

/**
 * Real-time listener for User Notifications (GOVI-114)
 */
export const subscribeToUserNotifications = (uid, onUpdate) => {
  if (!uid) return () => { };
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('recipientUid', '==', uid));

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    onUpdate(notifs);
  }, (error) => {
    console.error('Error subscribing to notifications:', error);
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
      onboardingTourCompleted: false,
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
  const isAdminEmail = cleanEmail === 'govilink@admin.lk' || cleanEmail === 'admin.demo@govilink.lk';
  const isDevFarmer = cleanEmail === 'farmer@govilink.lk' || cleanEmail === 'farmer.demo@govilink.lk';
  const isDevBuyer = cleanEmail === 'buyer@govilink.lk' || cleanEmail === 'buyer.demo@govilink.lk';
  const isDevDriver = cleanEmail === 'driver@govilink.lk' || cleanEmail === 'driver.demo@govilink.lk';
  const isDevAccount = isAdminEmail || isDevFarmer || isDevBuyer || isDevDriver;

  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (authErr) {
      // If default demo/dev account doesn't exist in Firebase Auth yet, auto-create it
      if (isDevAccount && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
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

    let expectedDevRole = null;
    let expectedDevName = null;
    if (isAdminEmail) {
      expectedDevRole = 'cooperative_admin';
      expectedDevName = 'GoviLink Cooperative Admin';
    } else if (isDevFarmer) {
      expectedDevRole = 'farmer';
      expectedDevName = 'Sunil Weerasinghe (Farmer)';
    } else if (isDevBuyer) {
      expectedDevRole = 'buyer';
      expectedDevName = 'Nimal Perera (Buyer)';
    } else if (isDevDriver) {
      expectedDevRole = 'driver';
      expectedDevName = 'Kamal Bandara (Driver)';
    }

    if (profileResult.success) {
      const existingProfile = profileResult.profile;
      // If dev role login, ensure role matches expected role in Firestore
      if (expectedDevRole && existingProfile.role !== expectedDevRole) {
        const updatedProfile = { ...existingProfile, role: expectedDevRole };
        await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
        return { success: true, user, profile: updatedProfile };
      }
      return { success: true, user, profile: existingProfile };
    }

    // Profile document missing in Firestore — initialize user profile document
    const newProfile = {
      uid: user.uid,
      email: cleanEmail,
      fullName: expectedDevName || user.displayName || 'GoviLink User',
      phoneNumber: '0770000000',
      role: expectedDevRole || 'buyer',
      district: 'Nuwara Eliya',
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

  if (driver.status === 'INACTIVE' || driver.status === 'OFF_DUTY' || driver.isOnDuty === false) {
    return {
      isAvailable: false,
      activeOrder: null,
      reason: 'Driver is currently off duty / inactive.',
    };
  }

  return {
    isAvailable: true,
    activeOrder: null,
    reason: null,
  };
};

/**
 * Real-time listener for Cooperative Fleet Drivers (Real Firestore data only)
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

      onUpdate(realDrivers);
    },
    (error) => {
      console.warn('Firestore drivers subscription warning:', error);
      onUpdate([]);
    }
  );
};

/**
 * Helpers for Delivery Filtering (GOVI-144, GOVI-145)
 */
export const getPendingDeliveriesList = (ordersList = []) => {
  return (ordersList || []).filter(
    (o) => !o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
};

export const getAssignedDeliveriesList = (ordersList = []) => {
  return (ordersList || []).filter(
    (o) => o.driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
};

export const getAvailableFleetDrivers = (driversList = [], ordersList = []) => {
  return (driversList || []).filter((d) => {
    const res = checkDriverAvailability(d, ordersList);
    return res.isAvailable;
  });
};

/**
 * Assign a driver to an order (GOVI-146, GOVI-147)
 * Validates admin authorization, driver availability, and delivery state.
 *
 * @param {object|string} orderOrId - Order object or orderId string
 * @param {object} driver - Selected driver object
 * @param {object} [adminProfile] - Authenticated admin user profile
 * @param {object} [options] - Optional configurations { targetStatus, skipAvailabilityCheck }
 */
export const assignDriverToOrder = async (
  orderOrId,
  driver,
  vehicleOrAdmin = null,
  adminProfileOrOptions = null,
  options = {}
) => {
  try {
    const orderId = typeof orderOrId === 'object' ? (orderOrId.id || orderOrId.orderNo) : orderOrId;
    const orderObj = typeof orderOrId === 'object' ? orderOrId : {};

    if (!orderId) {
      return { success: false, error: 'Delivery order ID is required.' };
    }
    if (!driver || (!driver.uid && !driver.id)) {
      return { success: false, error: 'A valid driver must be selected for assignment.' };
    }

    let vehicle = null;
    let adminProfile = null;
    let opts = options;

    if (
      vehicleOrAdmin &&
      (vehicleOrAdmin.plateNumber ||
        vehicleOrAdmin.vehicleType ||
        vehicleOrAdmin.capacity !== undefined ||
        (vehicleOrAdmin.id && vehicleOrAdmin.driverUid))
    ) {
      vehicle = vehicleOrAdmin;
      adminProfile = adminProfileOrOptions;
    } else {
      adminProfile = vehicleOrAdmin;
      opts = adminProfileOrOptions || {};
    }

    // 1. Admin Authorization Guard (GOVI-146)
    if (adminProfile) {
      const role = adminProfile.role;
      const email = adminProfile.email?.toLowerCase();
      const isAdmin = role === 'cooperative_admin' || role === 'admin' || email === 'govilink@admin.lk';
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only cooperative administrators can assign drivers.' };
      }
    }

    // Validate Driver role
    if (driver.role && driver.role !== 'driver') {
      return { success: false, error: 'Selected user is not registered as a delivery driver.' };
    }

    const orderDocRef = doc(db, 'orders', orderId);
    let existingOrderData = orderObj;

    // Fetch live order doc if available
    try {
      const orderDocSnap = await getDoc(orderDocRef);
      if (orderDocSnap.exists()) {
        existingOrderData = { id: orderDocSnap.id, ...orderDocSnap.data(), ...orderObj };
      }
    } catch (_readErr) {
      // In offline/mock fallback, use orderObj
    }

    // 2. Validate Delivery Eligibility
    const currentStatus = (existingOrderData.status || 'PENDING').toUpperCase();
    if (currentStatus === 'DELIVERED') {
      return { success: false, error: 'Cannot assign a driver to a completed delivery.' };
    }
    if (currentStatus === 'CANCELLED') {
      return { success: false, error: 'Cannot assign a driver to a cancelled delivery.' };
    }

    // Vehicle validation if provided
    if (vehicle) {
      const driverUid = driver.uid || driver.id;
      if (vehicle.driverUid && vehicle.driverUid !== driverUid) {
        return { success: false, error: 'Selected vehicle does not belong to the selected driver.' };
      }
      if (vehicle.status === 'IN_USE') {
        return { success: false, error: `Vehicle ${vehicle.plateNumber || ''} is currently in use on another delivery.` };
      }
      if (vehicle.status === 'MAINTENANCE') {
        return { success: false, error: `Vehicle ${vehicle.plateNumber || ''} is currently under maintenance.` };
      }
      if (vehicle.status === 'INACTIVE') {
        return { success: false, error: `Vehicle ${vehicle.plateNumber || ''} is currently inactive.` };
      }
    }

    const nowIso = new Date().toISOString();
    const targetStatus = opts.targetStatus || (currentStatus === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'ASSIGNED');

    const vehiclePlate = vehicle?.plateNumber || driver.vehicleNumber || driver.plateNumber || 'Transport Vehicle';
    const vehicleType = vehicle?.vehicleType || driver.vehicleType || 'lorry';
    const vehicleLabel = vehicle
      ? `${vehicle.plateNumber} (${vehicle.makeModel || vehicle.vehicleTypeLabel || vehicle.vehicleType || 'Fleet'})`
      : driver.vehicleNumber || driver.plateNumber || driver.makeModel || 'Transport Vehicle';

    // 3. Driver assignment payload
    const driverPayload = {
      ...(existingOrderData.produceName ? { produceName: existingOrderData.produceName } : {}),
      ...(existingOrderData.farmerName ? { farmerName: existingOrderData.farmerName } : {}),
      ...(existingOrderData.farmerPhone ? { farmerPhone: existingOrderData.farmerPhone } : {}),
      ...(existingOrderData.pickupLocation ? { pickupLocation: existingOrderData.pickupLocation } : {}),
      ...(existingOrderData.deliveryAddress ? { deliveryAddress: existingOrderData.deliveryAddress } : {}),
      ...(existingOrderData.buyerName ? { buyerName: existingOrderData.buyerName } : {}),
      ...(existingOrderData.buyerPhone ? { buyerPhone: existingOrderData.buyerPhone } : {}),
      ...(existingOrderData.qty ? { qty: existingOrderData.qty } : {}),
      ...(existingOrderData.unit ? { unit: existingOrderData.unit } : {}),
      driverId: driver.uid || driver.id,
      driverName: driver.fullName || driver.name || 'Cooperative Driver',
      driverPhone: driver.phoneNumber || driver.phone || '',
      driverVehicle: vehicleLabel,
      driverVehicleType: vehicleType,
      driverRating: driver.rating || '4.9',
      status: targetStatus,
      assignedAt: serverTimestamp(),
      assignedAtIso: nowIso,
      updatedAt: serverTimestamp(),
    };

    if (vehicle) {
      driverPayload.vehicleId = vehicle.id;
      driverPayload.driverVehicleId = vehicle.id;
      driverPayload.vehiclePlateNumber = vehicle.plateNumber || '';
      driverPayload.vehicleCapacity = vehicle.capacity || null;
      driverPayload.vehicleMakeModel = vehicle.makeModel || '';
    }

    // Append to statusHistory cleanly (GOVI-150)
    const existingHistory = Array.isArray(existingOrderData.statusHistory) ? existingOrderData.statusHistory : [];
    const statusEntry = {
      status: targetStatus,
      timestamp: nowIso,
      changedBy: adminProfile?.fullName || 'Cooperative Administrator',
      actorRole: 'admin',
      notes: `Driver ${driver.fullName || 'Driver'} assigned to delivery with vehicle ${vehiclePlate}`,
    };
    driverPayload.statusHistory = [...existingHistory, statusEntry];

    // Append to assignmentHistory (GOVI-146, GOVI-147)
    const existingAssignments = Array.isArray(existingOrderData.assignmentHistory) ? existingOrderData.assignmentHistory : [];
    const assignmentEntry = {
      driverId: driver.uid || driver.id,
      driverName: driver.fullName || driver.name,
      driverPhone: driver.phoneNumber || driver.phone || '',
      driverVehicle: vehicleLabel,
      vehicleId: vehicle?.id || null,
      vehiclePlateNumber: vehiclePlate,
      assignedAt: nowIso,
      assignedBy: adminProfile?.fullName || 'Administrator',
      action: 'INITIAL_ASSIGNMENT',
    };
    driverPayload.assignmentHistory = [...existingAssignments, assignmentEntry];

    await setDoc(orderDocRef, driverPayload, { merge: true });

    // Update vehicle status to ASSIGNED in Firestore
    if (vehicle && vehicle.id) {
      try {
        await updateDoc(doc(db, 'vehicles', vehicle.id), {
          status: 'ASSIGNED',
          currentOrderId: orderId,
          updatedAt: serverTimestamp(),
        });
      } catch (_vehErr) {
        console.warn('Vehicle status update warning (non-fatal):', _vehErr);
      }
    }

    // 4. Trigger Notifications (GOVI-114, GOVI-146)
    try {
      const notificationsRef = collection(db, 'notifications');
      const produceTitle = existingOrderData.produceName || 'Produce Batch';

      // Notify Driver
      if (driver.uid || driver.id) {
        await addDoc(notificationsRef, {
          orderId,
          recipientUid: driver.uid || driver.id,
          recipientRole: 'driver',
          title: 'New Delivery Assigned 🚛',
          message: `You have been assigned to transport ${produceTitle} from ${existingOrderData.pickupLocation || 'Farm'} to ${existingOrderData.deliveryAddress || 'Market'}.`,
          status: targetStatus,
          createdAt: serverTimestamp(),
          createdIso: nowIso,
          read: false,
        });
      }

      // Notify Buyer
      if (existingOrderData.buyerUid || existingOrderData.buyerId) {
        await addDoc(notificationsRef, {
          orderId,
          recipientUid: existingOrderData.buyerUid || existingOrderData.buyerId,
          recipientRole: 'buyer',
          title: 'Driver Dispatched 🚛',
          message: `Driver ${driver.fullName || 'Kamal'} (${vehiclePlate}) has been assigned to your order of ${produceTitle}.`,
          status: targetStatus,
          createdAt: serverTimestamp(),
          createdIso: nowIso,
          read: false,
        });
      }

      // Notify Farmer
      if (existingOrderData.farmerUid || existingOrderData.farmerId) {
        await addDoc(notificationsRef, {
          orderId,
          recipientUid: existingOrderData.farmerUid || existingOrderData.farmerId,
          recipientRole: 'farmer',
          title: 'Pickup Driver Assigned 🚛',
          message: `Driver ${driver.fullName || 'Kamal'} (${vehiclePlate}) has been scheduled to collect ${produceTitle} from your farm.`,
          status: targetStatus,
          createdAt: serverTimestamp(),
          createdIso: nowIso,
          read: false,
        });
      }
    } catch (_notifyErr) {
      console.warn('Driver assignment notification warning (non-fatal):', _notifyErr);
    }

    return {
      success: true,
      orderId,
      driver,
      vehicle,
      status: targetStatus,
      assignedAtIso: nowIso,
    };
  } catch (error) {
    console.error('Error assigning driver to order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reassign driver to an existing delivery order (GOVI-151)
 * Safely updates driver and vehicle assignment while preventing reassignment on terminal states.
 *
 * @param {object|string} orderOrId - Order object or orderId string
 * @param {object} newDriver - The newly selected replacement driver
 * @param {object} [vehicleOrAdmin] - Selected vehicle or adminProfile
 * @param {object|string} [adminProfileOrReason] - Authenticated admin user profile or reason
 * @param {string} [reason] - Reason for reassignment
 */
export const reassignDriverForOrder = async (
  orderOrId,
  newDriver,
  vehicleOrAdmin = null,
  adminProfileOrReason = null,
  reason = 'Driver reassigned by cooperative administrator'
) => {
  try {
    const orderId = typeof orderOrId === 'object' ? (orderOrId.id || orderOrId.orderNo) : orderOrId;
    const orderObj = typeof orderOrId === 'object' ? orderOrId : {};

    if (!orderId) {
      return { success: false, error: 'Delivery order ID is required for reassignment.' };
    }
    if (!newDriver || (!newDriver.uid && !newDriver.id)) {
      return { success: false, error: 'A valid replacement driver must be selected.' };
    }

    let vehicle = null;
    let adminProfile = null;
    let reassignReason = reason;

    if (
      vehicleOrAdmin &&
      (vehicleOrAdmin.plateNumber ||
        vehicleOrAdmin.vehicleType ||
        vehicleOrAdmin.capacity !== undefined ||
        (vehicleOrAdmin.id && vehicleOrAdmin.driverUid))
    ) {
      vehicle = vehicleOrAdmin;
      adminProfile = adminProfileOrReason;
    } else {
      adminProfile = vehicleOrAdmin;
      if (typeof adminProfileOrReason === 'string') {
        reassignReason = adminProfileOrReason;
      }
    }

    // 1. Admin Authorization Guard (GOVI-151)
    if (adminProfile) {
      const role = adminProfile.role;
      const email = adminProfile.email?.toLowerCase();
      const isAdmin = role === 'cooperative_admin' || role === 'admin' || email === 'govilink@admin.lk';
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only cooperative administrators can reassign drivers.' };
      }
    }

    const orderDocRef = doc(db, 'orders', orderId);
    let existingOrderData = orderObj;

    // Fetch live order doc
    try {
      const orderDocSnap = await getDoc(orderDocRef);
      if (orderDocSnap.exists()) {
        existingOrderData = { id: orderDocSnap.id, ...orderDocSnap.data(), ...orderObj };
      }
    } catch (_readErr) {
      // Fallback to orderObj
    }

    const currentStatus = (existingOrderData.status || 'PENDING').toUpperCase();

    // 2. Strict terminal state validations (GOVI-151)
    if (currentStatus === 'DELIVERED') {
      return {
        success: false,
        error: 'Driver cannot be reassigned after delivery completion.',
      };
    }
    if (currentStatus === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot reassign driver for a cancelled delivery order.',
      };
    }

    // Validate replacement driver vehicle if provided
    if (vehicle) {
      const newDriverUid = newDriver.uid || newDriver.id;
      if (vehicle.driverUid && vehicle.driverUid !== newDriverUid) {
        return { success: false, error: 'Selected vehicle does not belong to the selected replacement driver.' };
      }
      if (vehicle.status === 'IN_USE') {
        return { success: false, error: `Vehicle ${vehicle.plateNumber || ''} is currently in use on another delivery.` };
      }
      if (vehicle.status === 'MAINTENANCE') {
        return { success: false, error: `Vehicle ${vehicle.plateNumber || ''} is currently under maintenance.` };
      }
    }

    const nowIso = new Date().toISOString();
    const previousDriverInfo = {
      driverId: existingOrderData.driverId || null,
      driverName: existingOrderData.driverName || 'Previous Driver',
      driverPhone: existingOrderData.driverPhone || '',
      driverVehicle: existingOrderData.driverVehicle || '',
      vehicleId: existingOrderData.vehicleId || existingOrderData.driverVehicleId || null,
    };

    // 3. Prevent duplicate assignment to same driver AND same vehicle
    const currentDriverId = existingOrderData.driverId;
    const newDriverId = newDriver.uid || newDriver.id;
    if (currentDriverId && currentDriverId === newDriverId && (!vehicle || vehicle.id === previousDriverInfo.vehicleId)) {
      return {
        success: false,
        error: `"${newDriver.fullName}" is already the assigned driver for this delivery.`,
      };
    }

    const vehiclePlate = vehicle?.plateNumber || newDriver.vehicleNumber || newDriver.plateNumber || 'Transport Vehicle';
    const vehicleType = vehicle?.vehicleType || newDriver.vehicleType || 'lorry';
    const vehicleLabel = vehicle
      ? `${vehicle.plateNumber} (${vehicle.makeModel || vehicle.vehicleTypeLabel || vehicle.vehicleType || 'Fleet'})`
      : newDriver.vehicleNumber || newDriver.plateNumber || newDriver.makeModel || 'Transport Vehicle';

    // 4. Build update payload
    const updatePayload = {
      driverId: newDriverId,
      driverName: newDriver.fullName || newDriver.name || 'Cooperative Driver',
      driverPhone: newDriver.phoneNumber || newDriver.phone || '',
      driverVehicle: vehicleLabel,
      driverVehicleType: vehicleType,
      driverRating: newDriver.rating || '4.9',
      reassignedAt: serverTimestamp(),
      reassignedAtIso: nowIso,
      updatedAt: serverTimestamp(),
    };

    if (vehicle) {
      updatePayload.vehicleId = vehicle.id;
      updatePayload.driverVehicleId = vehicle.id;
      updatePayload.vehiclePlateNumber = vehicle.plateNumber || '';
      updatePayload.vehicleCapacity = vehicle.capacity || null;
      updatePayload.vehicleMakeModel = vehicle.makeModel || '';
    }

    // Record in assignmentHistory (GOVI-151)
    const existingAssignments = Array.isArray(existingOrderData.assignmentHistory) ? existingOrderData.assignmentHistory : [];
    const reassignmentEntry = {
      previousDriverId: previousDriverInfo.driverId,
      previousDriverName: previousDriverInfo.driverName,
      previousVehicleId: previousDriverInfo.vehicleId,
      driverId: newDriverId,
      driverName: newDriver.fullName || newDriver.name,
      driverPhone: newDriver.phoneNumber || newDriver.phone || '',
      driverVehicle: vehicleLabel,
      vehicleId: vehicle?.id || null,
      vehiclePlateNumber: vehiclePlate,
      reassignedAt: nowIso,
      reassignedBy: adminProfile?.fullName || 'Administrator',
      reason: reassignReason,
      action: 'REASSIGNMENT',
    };
    updatePayload.assignmentHistory = [...existingAssignments, reassignmentEntry];

    // Record in statusHistory
    const existingHistory = Array.isArray(existingOrderData.statusHistory) ? existingOrderData.statusHistory : [];
    const statusEntry = {
      status: currentStatus,
      timestamp: nowIso,
      changedBy: adminProfile?.fullName || 'Cooperative Administrator',
      actorRole: 'admin',
      notes: `Driver reassigned from ${previousDriverInfo.driverName} to ${newDriver.fullName} (${vehiclePlate}): ${reassignReason}`,
    };
    updatePayload.statusHistory = [...existingHistory, statusEntry];

    await updateDoc(orderDocRef, updatePayload);

    // Release previous vehicle in Firestore
    if (previousDriverInfo.vehicleId && (!vehicle || vehicle.id !== previousDriverInfo.vehicleId)) {
      try {
        await updateDoc(doc(db, 'vehicles', previousDriverInfo.vehicleId), {
          status: 'AVAILABLE',
          currentOrderId: null,
          updatedAt: serverTimestamp(),
        });
      } catch (_vehRelErr) {
        console.warn('Previous vehicle release warning (non-fatal):', _vehRelErr);
      }
    }

    // Assign new vehicle in Firestore
    if (vehicle && vehicle.id) {
      try {
        await updateDoc(doc(db, 'vehicles', vehicle.id), {
          status: 'ASSIGNED',
          currentOrderId: orderId,
          updatedAt: serverTimestamp(),
        });
      } catch (_vehSetErr) {
        console.warn('New vehicle assignment warning (non-fatal):', _vehSetErr);
      }
    }

    // 5. Trigger Reassignment Notifications (GOVI-151)
    try {
      const notificationsRef = collection(db, 'notifications');
      const produceTitle = existingOrderData.produceName || 'Produce Batch';

      // Notify Previous Driver
      if (previousDriverInfo.driverId) {
        await addDoc(notificationsRef, {
          orderId,
          recipientUid: previousDriverInfo.driverId,
          recipientRole: 'driver',
          title: 'Delivery Reassigned ℹ️',
          message: `Delivery #${orderId} (${produceTitle}) was reassigned by cooperative administration. Reason: ${reason}`,
          status: currentStatus,
          createdAt: serverTimestamp(),
          createdIso: nowIso,
          read: false,
        });
      }

      // Notify New Driver
      await addDoc(notificationsRef, {
        orderId,
        recipientUid: newDriverId,
        recipientRole: 'driver',
        title: 'New Delivery Assigned 🚛',
        message: `You have been reassigned to deliver ${produceTitle} from ${existingOrderData.pickupLocation || 'Farm'} to ${existingOrderData.deliveryAddress || 'Destination'}.`,
        status: currentStatus,
        createdAt: serverTimestamp(),
        createdIso: nowIso,
        read: false,
      });

      // Notify Buyer
      if (existingOrderData.buyerUid || existingOrderData.buyerId) {
        await addDoc(notificationsRef, {
          orderId,
          recipientUid: existingOrderData.buyerUid || existingOrderData.buyerId,
          recipientRole: 'buyer',
          title: 'Delivery Driver Updated 🚛',
          message: `Your delivery driver has been updated to ${newDriver.fullName} (${newDriver.vehicleNumber || 'Vehicle'}).`,
          status: currentStatus,
          createdAt: serverTimestamp(),
          createdIso: nowIso,
          read: false,
        });
      }
    } catch (_notifErr) {
      console.warn('Reassignment notification warning (non-fatal):', _notifErr);
    }

    return {
      success: true,
      orderId,
      newDriver,
      previousDriver: previousDriverInfo,
      reassignedAtIso: nowIso,
    };
  } catch (error) {
    console.error('Error reassigning driver for order:', error);
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
  const targetQuery = buyerUid
    ? query(requestsRef, where('buyerUid', '==', buyerUid))
    : requestsRef;

  return onSnapshot(
    targetQuery,
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
export const subscribeToDriverVehicles = (driverUid, onUpdate, onError) => {
  if (!driverUid) {
    onUpdate([]);
    return () => { };
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
      if (onError) onError(error);
      onUpdate([]);
    }
  );
};

/**
 * Real-time listener for ALL vehicles in Firestore (for Admin Dashboard & fleet metrics)
 */
export const subscribeToAllVehicles = (onUpdate, onError) => {
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
      if (onError) onError(error);
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

/** Decline a driver's assignment before pickup, keeping the order open. */
export const rejectDriverDelivery = async (orderId, driverUid) => {
  try {
    if (!orderId || !driverUid || auth.currentUser?.uid !== driverUid) {
      throw new Error('Please sign in as the assigned driver.');
    }
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists()) throw new Error('Delivery not found.');
      const order = snapshot.data();
      if (order.driverId !== driverUid) throw new Error('This delivery is no longer assigned to you.');
      if (!['ASSIGNED', 'ACCEPTED', 'READY_FOR_PICKUP'].includes(order.status)) {
        throw new Error('A delivery can only be rejected before pickup.');
      }
      const timestamp = new Date().toISOString();
      transaction.update(orderRef, {
        status: 'READY_FOR_PICKUP',
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverVehicle: null,
        driverVehicleType: null,
        driverRating: null,
        assignedAt: null,
        assignedAtIso: null,
        updatedAt: serverTimestamp(),
        assignmentHistory: [
          ...(Array.isArray(order.assignmentHistory) ? order.assignmentHistory : []),
          { action: 'DRIVER_REJECTED', driverId: driverUid, driverName: order.driverName || '', timestamp },
        ],
        statusHistory: [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
          { status: 'READY_FOR_PICKUP', timestamp, changedBy: order.driverName || 'Driver', actorRole: 'driver', notes: 'Driver rejected assignment; awaiting reassignment.' },
        ],
      });
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

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

// Keep dispatch metadata in sync for clients that use the driver's profile.
const driverDispatchProfile = (vehicles) => {
  const selected = vehicles.filter((vehicle) => vehicle.isActive);
  const primary = selected[0] || null;
  return {
    dispatchVehicleIds: selected.map((vehicle) => vehicle.id),
    dispatchVehicles: selected.map((vehicle) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber || '',
      makeModel: vehicle.makeModel || '',
      vehicleType: vehicle.vehicleType || '',
    })),
    vehicleNumber: primary?.plateNumber || '',
    vehicleType: primary?.vehicleType || '',
    vehicle: primary,
    updatedAt: serverTimestamp(),
  };
};

/** Delete a vehicle and remove it from dispatch metadata. */
export const deleteDriverVehicle = async (vehicleId, driverUid) => {
  try {
    if (!driverUid || !vehicleId) throw new Error('Please sign in and select a vehicle.');
    const snapshot = await getDocs(query(collection(db, 'vehicles'), where('driverUid', '==', driverUid)));
    const vehicles = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
    if (!vehicles.some((vehicle) => vehicle.id === vehicleId)) throw new Error('This vehicle is not in your fleet.');
    const batch = writeBatch(db);
    batch.delete(doc(db, 'vehicles', vehicleId));
    batch.update(doc(db, 'users', driverUid), driverDispatchProfile(vehicles.filter((vehicle) => vehicle.id !== vehicleId)));
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/** Select or remove one vehicle without changing other fleet selections. */
export const setActiveDriverVehicle = async (driverUid, vehicleId, isActive = true) => {
  try {
    if (!driverUid || !vehicleId || typeof isActive !== 'boolean') throw new Error('Please sign in and select a valid vehicle.');
    const snapshot = await getDocs(query(collection(db, 'vehicles'), where('driverUid', '==', driverUid)));
    const vehicles = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
    if (!vehicles.some((vehicle) => vehicle.id === vehicleId)) throw new Error('This vehicle is not in your fleet.');
    const selectedVehicles = vehicles.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, isActive } : vehicle);
    const batch = writeBatch(db);
    batch.update(doc(db, 'vehicles', vehicleId), { isActive, updatedAt: serverTimestamp() });
    batch.update(doc(db, 'users', driverUid), driverDispatchProfile(selectedVehicles));
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
