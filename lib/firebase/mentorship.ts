import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  Firestore,
} from "firebase/firestore";
import { db } from "./config";
import { MentorshipRequest } from "@/types";

// Helper function to ensure db is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

export const createMentorshipRequest = async (
  studentId: string,
  mentorId: string,
  message?: string,
  requestedDate?: Date
): Promise<string> => {
  const firestore = getDb();
  
  const requestData: any = {
    studentId,
    mentorId,
    status: "pending",
    requestedDate: Timestamp.fromDate(requestedDate || new Date()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only add message if it exists
  if (message && message.trim()) {
    requestData.message = message.trim();
  }

  const docRef = await addDoc(collection(firestore, "mentorshipRequests"), requestData);

  return docRef.id;
};

export const getMentorshipRequest = async (requestId: string): Promise<MentorshipRequest | null> => {
  const firestore = getDb();
  const requestDoc = await getDoc(doc(firestore, "mentorshipRequests", requestId));
  if (!requestDoc.exists()) return null;

  const data = requestDoc.data();
  return {
    id: requestDoc.id,
    ...data,
    requestedDate: data.requestedDate?.toDate() || new Date(),
    scheduledDate: data.scheduledDate?.toDate(),
    completedDate: data.completedDate?.toDate(),
    feedback: data.feedback
      ? {
          ...data.feedback,
          createdAt: data.feedback.createdAt?.toDate() || new Date(),
        }
      : undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as MentorshipRequest;
};

export const getMentorshipRequestsByStudent = async (studentId: string): Promise<MentorshipRequest[]> => {
  const firestore = getDb();
  const q = query(
    collection(firestore, "mentorshipRequests"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      requestedDate: data.requestedDate?.toDate() || new Date(),
      scheduledDate: data.scheduledDate?.toDate(),
      completedDate: data.completedDate?.toDate(),
      feedback: data.feedback
        ? {
            ...data.feedback,
            createdAt: data.feedback.createdAt?.toDate() || new Date(),
          }
        : undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as MentorshipRequest;
  });
};

export const getMentorshipRequestsByMentor = async (mentorId: string): Promise<MentorshipRequest[]> => {
  const firestore = getDb();
  const q = query(
    collection(firestore, "mentorshipRequests"),
    where("mentorId", "==", mentorId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      requestedDate: data.requestedDate?.toDate() || new Date(),
      scheduledDate: data.scheduledDate?.toDate(),
      completedDate: data.completedDate?.toDate(),
      feedback: data.feedback
        ? {
            ...data.feedback,
            createdAt: data.feedback.createdAt?.toDate() || new Date(),
          }
        : undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as MentorshipRequest;
  });
};

export const updateMentorshipRequest = async (
  requestId: string,
  updates: Partial<Omit<MentorshipRequest, "id" | "createdAt">>
): Promise<void> => {
  const firestore = getDb();
  const requestRef = doc(firestore, "mentorshipRequests", requestId);
  const updateData: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.scheduledDate) {
    updateData.scheduledDate = Timestamp.fromDate(updates.scheduledDate);
  }
  if (updates.completedDate) {
    updateData.completedDate = Timestamp.fromDate(updates.completedDate);
  }
  if (updates.feedback) {
    updateData.feedback = {
      ...updates.feedback,
      createdAt: serverTimestamp(),
    };
  }

  await updateDoc(requestRef, updateData);
};

// Get available mentors (alumni users)
export const getAvailableMentors = async (): Promise<any[]> => {
  const firestore = getDb();
  const q = query(
    collection(firestore, "users"),
    where("role", "==", "alumni")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
};

// Check if student already has a request with this mentor
export const checkExistingRequest = async (
  studentId: string,
  mentorId: string
): Promise<boolean> => {
  const firestore = getDb();
  const q = query(
    collection(firestore, "mentorshipRequests"),
    where("studentId", "==", studentId),
    where("mentorId", "==", mentorId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

