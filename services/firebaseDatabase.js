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
import { db, auth } from '../firebaseConfig';

// -------------------------------------------------------
// DEFAULT SAMPLE PRODUCE (Used when Firestore collection is empty)
// -------------------------------------------------------
export const DEFAULT_PRODUCE_LISTINGS = [
  {
    id: 'sample_1',
    nameEn: 'Fresh Nuwara Eliya Carrots',
    nameSi: 'නුවරඑළිය නැවුම් කැරට්',
    nameTa: 'நுவரெலியா கேரட்',
    category: 'Vegetables',
    price: 340,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    stockQty: 500,
    farmerName: 'Bandara Farm (Saman Bandara)',
    farmerId: 'sample_farmer_1',
    location: 'Nuwara Eliya',
    district: 'nuwara_eliya',
    grade: 'Grade A Export Quality',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, organically cultivated mountain highland carrots harvested yesterday morning.',
  },
  {
    id: 'sample_2',
    nameEn: 'Organic Red Onions (Rathu Lunu)',
    nameSi: 'දේශීය රතු ළුණු',
    nameTa: 'சிவப்பு வெங்காயம்',
    category: 'Vegetables',
    price: 480,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    stockQty: 850,
    farmerName: 'Dambulla Agro Co-op (Kamal Silva)',
    farmerId: 'sample_farmer_2',
    location: 'Dambulla, Matale',
    district: 'matale',
    grade: 'Medium Dry Cured',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    description: 'Sun-dried high-pungency red shallots sourced directly from dry zone growers.',
  },
  {
    id: 'sample_3',
    nameEn: 'Keeri Samba Raw Rice',
    nameSi: 'කීරි සම්බා සහල්',
    nameTa: 'கீரி சம்பா அரிசி',
    category: 'Rice & Grains',
    price: 260,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    stockQty: 2400,
    farmerName: 'Rajarata Paddy Mill (Nihal Jayasuriya)',
    farmerId: 'sample_farmer_3',
    location: 'Polonnaruwa',
    district: 'polonnaruwa',
    grade: 'Premium Polished 25kg Bags',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: 'Aromatic, fine-grain single-origin Mahaweli irrigated Keeri Samba.',
  },
  {
    id: 'sample_4',
    nameEn: 'Ambul Banana Fresh Bunch',
    nameSi: 'ඇඹුල් කෙසෙල්',
    nameTa: 'ஆம்புல் வாழைப்பழம்',
    category: 'Fruits',
    price: 210,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    stockQty: 320,
    farmerName: 'Southern Green Orchards',
    farmerId: 'sample_farmer_4',
    location: 'Embilipitiya, Ratnapura',
    district: 'ratnapura',
    grade: 'Naturally Ripened',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    description: 'Sweet and tangy sweet-banana bunches, free from chemical accelerators.',
  },
  {
    id: 'sample_5',
    nameEn: 'Pure Ceylon Alba Cinnamon',
    nameSi: 'සැබෑ කුරුඳු පොතු',
    nameTa: 'இலங்கை இலவங்கப்பட்டை',
    category: 'Spices',
    price: 3400,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    stockQty: 75,
    farmerName: 'Matara Spice Collective',
    farmerId: 'sample_farmer_5',
    location: 'Mirissa, Matara',
    district: 'matara',
    grade: 'Alba Grade Hand-Rolled',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
    description: 'Finest slender quills with high eugenol fragrance from Southern coastal groves.',
  },
];

// -------------------------------------------------------
// PRODUCE LISTINGS
// -------------------------------------------------------

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
    const produceRef = collection(db, 'produce');
    const docRef = await addDoc(produceRef, {
      ...produceData,
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
    const produceDocRef = doc(db, 'produce', produceId);
    await updateDoc(produceDocRef, {
      ...updatedData,
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
