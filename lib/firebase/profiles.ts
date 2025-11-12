import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { UserProfile } from "@/types";

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
  
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId));
    if (!profileDoc.exists()) return null;

    const data = profileDoc.data();
    return {
      userId: profileDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    if (error.code === "permission-denied" || error.code === "unavailable") {
      console.warn("Firestore access denied or unavailable. Please check your Firestore setup and security rules.");
      return null;
    }
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, "userId" | "createdAt" | "updatedAt">>
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }

  const profileRef = doc(db, "profiles", userId);
  
  // Check if profile exists
  const profileDoc = await getDoc(profileRef);
  
  // Remove undefined values as Firestore doesn't accept them
  const cleanUpdates: any = {};

  // Only include defined values
  Object.keys(updates).forEach((key) => {
    const value = (updates as any)[key];
    if (value !== undefined && value !== null) {
      cleanUpdates[key] = value;
    }
  });

  if (!profileDoc.exists()) {
    // Create new profile if it doesn't exist
    await setDoc(profileRef, {
      userId,
      ...cleanUpdates,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing profile
    await updateDoc(profileRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
  }
};

