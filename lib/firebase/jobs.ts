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
  limit,
  Firestore,
} from "firebase/firestore";
import { db } from "./config";
import { JobPosting, JobApplication } from "@/types";

// Helper function to ensure db is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

export const createJobPosting = async (
  postedBy: string,
  jobData: Omit<
    JobPosting,
    "id" | "postedBy" | "createdAt" | "updatedAt" | "applicationsCount"
  >
): Promise<string> => {
  const firestore = getDb();

  const postingData: any = {
    postedBy,
    ...jobData,
    applicationsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Remove undefined values as Firestore doesn't accept them
  Object.keys(postingData).forEach((key) => {
    if (postingData[key] === undefined) {
      delete postingData[key];
    }
  });

  const docRef = await addDoc(collection(firestore, "jobPostings"), postingData);

  return docRef.id;
};

export const getJobPosting = async (jobId: string): Promise<JobPosting | null> => {
  const firestore = getDb();

  const jobDoc = await getDoc(doc(firestore, "jobPostings", jobId));
  if (!jobDoc.exists()) return null;

  const data = jobDoc.data();
  return {
    id: jobDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as JobPosting;
};

export const getJobPostings = async (
  filters?: {
    type?: string;
    location?: string;
    isReferral?: boolean;
    status?: string;
  },
  limitCount: number = 50
): Promise<JobPosting[]> => {
  const firestore = getDb();

  try {
    let q = query(collection(firestore, "jobPostings"), orderBy("createdAt", "desc"));

    if (filters?.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters?.type) {
      q = query(q, where("type", "==", filters.type));
    }

    if (filters?.isReferral !== undefined) {
      q = query(q, where("isReferral", "==", filters.isReferral));
    }

    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as JobPosting;
      })
      .filter((job) => {
        if (filters?.location && job.location !== filters.location) return false;
        return true;
      });
  } catch (error: any) {
    // Handle missing index error
    if (error.code === "failed-precondition" || error.message?.includes("index")) {
      console.error(
        "Firestore index required. Please create the composite index for jobPostings queries:",
        error.message
      );
      // If the error contains a link to create the index, log it
      if (error.message?.includes("https://console.firebase.google.com")) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        if (indexUrl) {
          console.error("Create index at:", indexUrl);
        }
      }
      // Return empty array gracefully so the app doesn't crash
      return [];
    }
    throw error;
  }
};

export const createJobApplication = async (
  jobId: string,
  applicantId: string,
  resumeUrl?: string,
  coverLetter?: string
): Promise<string> => {
  const firestore = getDb();

  // Remove undefined values as Firestore doesn't accept them
  const applicationData: any = {
    jobId,
    applicantId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only add optional fields if they exist
  if (resumeUrl) {
    applicationData.resumeUrl = resumeUrl;
  }
  if (coverLetter) {
    applicationData.coverLetter = coverLetter;
  }

  const docRef = await addDoc(collection(firestore, "jobApplications"), applicationData);

  // Increment applications count
  const jobRef = doc(firestore, "jobPostings", jobId);
  const jobDoc = await getDoc(jobRef);
  if (jobDoc.exists()) {
    await updateDoc(jobRef, {
      applicationsCount: (jobDoc.data().applicationsCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  }

  return docRef.id;
};

export const getJobApplicationsByJob = async (jobId: string): Promise<JobApplication[]> => {
  const firestore = getDb();

  const q = query(
    collection(firestore, "jobApplications"),
    where("jobId", "==", jobId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as JobApplication;
  });
};

export const getJobApplicationsByApplicant = async (
  applicantId: string
): Promise<JobApplication[]> => {
  const firestore = getDb();

  const q = query(
    collection(firestore, "jobApplications"),
    where("applicantId", "==", applicantId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as JobApplication;
  });
};

export const updateJobApplication = async (
  applicationId: string,
  updates: Partial<Omit<JobApplication, "id" | "createdAt">>
): Promise<void> => {
  const firestore = getDb();

  await updateDoc(doc(firestore, "jobApplications", applicationId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

