import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database'; // Added import for Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv-vvLaxHB5tJyz6Uh_3PxHvatwWX-OJ4",
  authDomain: "od-forms.firebaseapp.com",
  databaseURL: "https://od-forms-default-rtdb.firebaseio.com",
  projectId: "od-forms",
  storageBucket: "od-forms.firebasestorage.app",
  messagingSenderId: "197198363961",
  appId: "1:197198363961:web:af3009a8456e8424e5fce8",
  measurementId: "G-9ZV56YH0D0",
  databaseURL: "https://od-forms-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app); // Initialize Realtime Database
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, rtdb, storage, analytics }; // Added rtdb to exports
export default app;