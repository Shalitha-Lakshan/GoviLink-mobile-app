import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

// Default Sri Lanka Context Produce Data for Initial Firestore Seeding
const INITIAL_PRODUCE = [
  {
    nameEn: 'Fresh Nuwara Eliya Carrots',
    nameSi: 'නුවරඑළිය නැවුම් කැරට්',
    nameTa: 'நுவப்ரஎலியா கேரட்',
    category: 'Vegetables',
    price: 340,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    farmerName: 'Sunil Bandara',
    location: 'Nuwara Eliya',
    stockQty: 450,
    image: 'https://images.unsplash.com/photo-1598170845058-12ef4a457c3b?w=400&q=80',
  },
  {
    nameEn: 'Organic Red Onions (Rathu Lunu)',
    nameSi: 'කාබනික රතු ළූණු',
    nameTa: 'சிவப்பு வெங்காயம்',
    category: 'Vegetables',
    price: 520,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    farmerName: 'K. Rajaratnam',
    location: 'Jaffna',
    stockQty: 800,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  },
  {
    nameEn: 'Keeri Samba Rice',
    nameSi: 'කීරි සම්බා සහල්',
    nameTa: 'கீரி சம்பா அரிசி',
    category: 'Rice & Grains',
    price: 260,
    unitEn: 'kg',
    unitSi: 'කි.ග්‍රෑ.',
    unitTa: 'கிலோ',
    farmerName: 'Mahinda Ranasinghe',
    location: 'Polonnaruwa',
    stockQty: 1200,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  },
  {
    nameEn: 'Ceylon Cinnamon Bundles',
    nameSi: 'ලංකා කුරුඳු මිටි',
    nameTa: 'இலங்கை இலவங்கப்பட்டை',
    category: 'Spices',
    price: 1450,
    unitEn: 'bundle',
    unitSi: 'මිටිය',
    unitTa: 'கட்டு',
    farmerName: 'P. G. Gamage',
    location: 'Matara',
    stockQty: 150,
    image: 'https://images.unsplash.com/photo-1509358271058-acd05cc93898?w=400&q=80',
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

  return onSnapshot(produceRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed default initial produce items into Firestore if empty
      for (const item of INITIAL_PRODUCE) {
        await addDoc(produceRef, {
          ...item,
          createdAt: serverTimestamp(),
        });
      }
    } else {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onUpdate(items);
    }
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
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding produce to Firestore:', error);
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
  try {
    // 1. Firebase Auth sign-in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Fetch Firestore profile
    const profileResult = await getUserProfile(user.uid);

    if (!profileResult.success) {
      // Auth succeeded but Firestore doc is missing — handle safely
      console.warn('Firebase Auth OK but Firestore profile missing for uid:', user.uid);
      return {
        success: true,
        user,
        profile: {
          uid: user.uid,
          email: user.email,
          fullName: '',
          phoneNumber: '',
          role: 'buyer',
        },
      };
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
