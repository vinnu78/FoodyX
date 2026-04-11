// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY, // from .env
  authDomain: "foodyx-c660c.firebaseapp.com",
  projectId: "foodyx-c660c",
  storageBucket: "foodyx-c660c.firebasestorage.app",
  messagingSenderId: "819197441045",
  appId: "1:819197441045:web:68022a07bb7340a42aca1c",
  measurementId: "G-8P7K0Q3QQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);       // Authentication
const analytics = getAnalytics(app); // Analytics (optional)

// Export the initialized services
export { app, auth, analytics };