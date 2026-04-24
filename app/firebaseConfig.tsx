
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBK1zkHlypdnwZrQPAQdBAJ-XlGqA1rhZk",
  authDomain: "tailorverse-6f7b9.firebaseapp.com",
  databaseURL: "https://tailorverse-6f7b9-default-rtdb.firebaseio.com",
  projectId: "tailorverse-6f7b9",
  storageBucket: "tailorverse-6f7b9.appspot.com", // ✅ FIXED
  messagingSenderId: "731508328803",
  appId: "1:731508328803:web:e707592e3926ffaa07ab56",
  measurementId: "G-SHGELL5EJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services (same as before)
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);