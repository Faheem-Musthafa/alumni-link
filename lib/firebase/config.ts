import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateConfig = () => {
  if (typeof window === "undefined") return false;
  
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  
  if (missing.length > 0) {
    console.error("Missing Firebase environment variables:", missing.join(", "));
    console.error("Please add these to your .env.local file");
    return false;
  }
  return true;
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  if (validateConfig()) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      
      // Log configuration status (without sensitive data)
      console.log("Firebase initialized successfully", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
      });
    } catch (error) {
      console.error("Firebase initialization error:", error);
      console.error("Current config:", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId,
      });
    }
  } else {
    console.error("Firebase configuration validation failed. Please check your .env.local file.");
  }
}

export { app, auth, db, storage };

