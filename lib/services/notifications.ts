import { Notification } from "@/types";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, Firestore } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Helper function to ensure db is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

// Email notifications using Resend (to be implemented with API routes)
export const sendEmailNotification = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // This will be handled by Next.js API routes
  await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
};

// WhatsApp notifications using Twilio (to be implemented with API routes)
export const sendWhatsAppNotification = async (
  to: string,
  message: string
): Promise<void> => {
  // This will be handled by Next.js API routes
  await fetch("/api/notifications/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message }),
  });
};

// Create notification in Firestore
export const createNotification = async (
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  link?: string
): Promise<string> => {
  const firestore = getDb();
  
  const notificationData: Omit<Notification, "id" | "createdAt"> = {
    userId,
    type,
    title,
    message,
    link,
    read: false,
  };

  const docRef = await addDoc(collection(firestore, "notifications"), {
    ...notificationData,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const firestore = getDb();
  const q = query(
    collection(firestore, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Notification;
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const firestore = getDb();
  await updateDoc(doc(firestore, "notifications", notificationId), {
    read: true,
  });
};

// Notification templates
export const notificationTemplates = {
  mentorship_request: (mentorName: string) => ({
    title: "New Mentorship Request",
    message: `You have received a mentorship request from ${mentorName}`,
  }),
  mentorship_accepted: (studentName: string) => ({
    title: "Mentorship Request Accepted",
    message: `Your mentorship request has been accepted by ${studentName}`,
  }),
  mentorship_rejected: (mentorName: string) => ({
    title: "Mentorship Request Update",
    message: `Your mentorship request to ${mentorName} was declined`,
  }),
  new_message: (senderName: string) => ({
    title: "New Message",
    message: `You have a new message from ${senderName}`,
  }),
  job_application: (jobTitle: string) => ({
    title: "New Job Application",
    message: `You have received an application for ${jobTitle}`,
  }),
};

