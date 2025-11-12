import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

// Typing indicator functions
export const setTypingStatus = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");

  const typingRef = doc(db, "conversations", conversationId, "typing", userId);
  
  if (isTyping) {
    await setDoc(typingRef, {
      isTyping: true,
      lastTyped: serverTimestamp(),
    });
  } else {
    await deleteDoc(typingRef);
  }
};

export const subscribeToTyping = (
  conversationId: string,
  currentUserId: string,
  callback: (isTyping: boolean, userId?: string) => void
): (() => void) => {
  if (!db) throw new Error("Firestore is not initialized");

  const typingCollectionRef = collection(db, "conversations", conversationId, "typing");
  
  return onSnapshot(typingCollectionRef, (snapshot) => {
    // Filter out current user's typing status
    const otherUsersTyping = snapshot.docs.filter(doc => doc.id !== currentUserId);
    
    if (otherUsersTyping.length > 0) {
      const typingUser = otherUsersTyping[0];
      const data = typingUser.data();
      
      // Check if typing was within last 3 seconds
      const lastTyped = data.lastTyped?.toDate();
      const now = new Date();
      const diffInSeconds = (now.getTime() - lastTyped?.getTime()) / 1000;
      
      if (diffInSeconds < 3) {
        callback(true, typingUser.id);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Online/Offline presence
export const setUserPresence = async (
  userId: string,
  status: "online" | "away" | "offline"
): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized");

  const presenceRef = doc(db, "userPresence", userId);
  
  await setDoc(presenceRef, {
    status,
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const subscribeToUserPresence = (
  userId: string,
  callback: (status: "online" | "away" | "offline", lastSeen?: Date) => void
): (() => void) => {
  if (!db) throw new Error("Firestore is not initialized");

  const presenceRef = doc(db, "userPresence", userId);
  
  return onSnapshot(presenceRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data.status, data.lastSeen?.toDate());
    } else {
      callback("offline");
    }
  });
};

// Initialize presence on login
export const initializePresence = (userId: string): (() => void) => {
  if (!db) throw new Error("Firestore is not initialized");
  
  // Set online immediately
  setUserPresence(userId, "online");
  
  // Update presence every 30 seconds
  const intervalId = setInterval(() => {
    setUserPresence(userId, "online");
  }, 30000);
  
  // Set offline on window close/unload
  const handleBeforeUnload = () => {
    setUserPresence(userId, "offline");
  };
  
  // Set away on visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setUserPresence(userId, "away");
    } else {
      setUserPresence(userId, "online");
    }
  };
  
  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  
  // Cleanup function
  return () => {
    clearInterval(intervalId);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    setUserPresence(userId, "offline");
  };
};

// Get user presence (one-time)
export const getUserPresence = async (
  userId: string
): Promise<{ status: "online" | "away" | "offline"; lastSeen?: Date }> => {
  if (!db) throw new Error("Firestore is not initialized");

  const presenceRef = doc(db, "userPresence", userId);
  const snapshot = await getDoc(presenceRef);
  
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      status: data.status,
      lastSeen: data.lastSeen?.toDate(),
    };
  }
  
  return { status: "offline" };
};
