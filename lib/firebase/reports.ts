import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  Firestore
} from "firebase/firestore";
import { db } from "./config";
import { UserReport } from "@/types";

// Helper function to ensure db is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

interface CreateReportParams {
  reportedUserId: string;
  reportedUserName: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  description: string;
}

export const createUserReport = async (params: CreateReportParams): Promise<string> => {
  const firestore = getDb();

  try {
    const reportData = {
      ...params,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, "userReports"), reportData);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating user report:", error);
    throw new Error(error.message || "Failed to create user report");
  }
};

export const getUserReports = async (status?: string): Promise<UserReport[]> => {
  const firestore = getDb();

  try {
    let q;
    if (status) {
      q = query(
        collection(firestore, "userReports"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(firestore, "userReports"), orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      reviewedAt: doc.data().reviewedAt?.toDate(),
    })) as UserReport[];
  } catch (error: any) {
    console.error("Error fetching user reports:", error);
    throw new Error(error.message || "Failed to fetch user reports");
  }
};

export const updateReportStatus = async (
  reportId: string,
  status: "pending" | "reviewed" | "resolved" | "dismissed",
  reviewedBy: string,
  action?: string
): Promise<void> => {
  const firestore = getDb();

  try {
    const reportRef = doc(firestore, "userReports", reportId);
    await updateDoc(reportRef, {
      status,
      reviewedBy,
      reviewedAt: serverTimestamp(),
      action: action || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Error updating report status:", error);
    throw new Error(error.message || "Failed to update report status");
  }
};
