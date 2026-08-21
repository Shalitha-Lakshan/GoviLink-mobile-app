import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { db, getFirebaseAuth } from '../firebaseConfig';

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
    nameTa: 'කீரி සම්බා அரிசி',
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

/**
 * Place a new Order in Firestore
 */
export const placeOrderInFirestore = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'PENDING', // PENDING -> PICKED_UP -> IN_TRANSIT -> DELIVERED
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

/**
 * Save user profile data to Firestore users collection
 */
export const saveUserToFirestore = async (userData) => {
  try {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign In User with Firebase Authentication & Firestore User Record
 */
export const loginWithFirebase = async (email, password) => {
  try {
    const auth = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Register User with Firebase Authentication & Save Profile to Firestore
 */
export const registerWithFirebase = async (userData) => {
  try {
    const auth = getFirebaseAuth();
    const { email, password, fullName, role, phone } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save profile details to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      fullName,
      email,
      phone,
      role: role || 'buyer',
      createdAt: serverTimestamp(),
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
