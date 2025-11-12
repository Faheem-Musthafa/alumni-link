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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./config";
import { ChatMessage, Conversation } from "@/types";

export const createConversation = async (participantIds: string[]): Promise<string> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationData: Omit<Conversation, "id" | "createdAt" | "updatedAt"> = {
    participants: participantIds,
  };

  const docRef = await addDoc(collection(db, "conversations"), {
    ...conversationData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
  if (!conversationDoc.exists()) return null;

  const data = conversationDoc.data();
  return {
    id: conversationDoc.id,
    ...data,
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
        }
      : undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Conversation;
};

export const getConversationBetweenUsers = async (
  userId1: string,
  userId2: string
): Promise<Conversation | null> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId1)
  );

  const snapshot = await getDocs(q);
  const conversation = snapshot.docs.find(
    (doc) => doc.data().participants.includes(userId2) && doc.data().participants.length === 2
  );

  if (!conversation) return null;

  const data = conversation.data();
  return {
    id: conversation.id,
    ...data,
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
        }
      : undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Conversation;
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  if (!db) {
    throw new Error("Firestore is not initialized. Please check your Firebase configuration.");
  }

  try {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            }
          : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Conversation;
    });
  } catch (error: any) {
    // Handle missing index error
    if (error.code === "failed-precondition" || error.message?.includes("index")) {
      console.error(
        "Firestore index required. Please create the composite index for conversations queries:",
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

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  messageType: "text" | "file" | "system" | "image" | "voice" | "video" | "document" = "text",
  mediaData?: {
    mediaUrl?: string;
    mediaType?: string;
    mediaSize?: number;
    thumbnailUrl?: string;
    duration?: number;
  },
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
  },
  replyTo?: string
): Promise<string> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const messageData: Omit<ChatMessage, "id" | "timestamp"> = {
    conversationId,
    senderId,
    receiverId,
    content,
    read: false,
    messageType,
    status: "sent",
    ...mediaData,
    ...(linkPreview && { linkPreview }),
    ...(replyTo && { replyTo }),
  };

  const docRef = await addDoc(collection(db, "messages"), {
    ...messageData,
    timestamp: serverTimestamp(),
  });

  // Update conversation last message
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    lastMessage: {
      content,
      timestamp: serverTimestamp(),
      senderId,
    },
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getMessages = async (
  conversationId: string,
  limitCount: number = 50
): Promise<ChatMessage[]> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as ChatMessage;
    })
    .reverse();
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ChatMessage;
      })
      .reverse();
    callback(messages);
  });
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  await updateDoc(doc(db, "messages", messageId), {
    read: true,
    status: "read",
    readAt: serverTimestamp(),
  });
};

// Mark message as delivered
export const markMessageAsDelivered = async (messageId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const messageRef = doc(db, "messages", messageId);
  const messageDoc = await getDoc(messageRef);
  
  if (messageDoc.exists()) {
    const data = messageDoc.data();
    // Only update if not already read
    if (data.status !== "read") {
      await updateDoc(messageRef, {
        status: "delivered",
        deliveredAt: serverTimestamp(),
      });
    }
  }
};

// Mark all messages in conversation as delivered for current user
export const markConversationMessagesDelivered = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("receiverId", "==", userId),
    where("status", "==", "sent")
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((docSnap) =>
    updateDoc(doc(db!, "messages", docSnap.id), {
      status: "delivered",
      deliveredAt: serverTimestamp(),
    })
  );

  await Promise.all(updates);
};

// Mark all messages in conversation as read for current user
export const markConversationMessagesRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    where("receiverId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((docSnap) =>
    updateDoc(doc(db!, "messages", docSnap.id), {
      read: true,
      status: "read",
      readAt: serverTimestamp(),
    })
  );

  await Promise.all(updates);
};

// Pin/Unpin conversation
export const togglePinConversation = async (
  conversationId: string,
  userId: string,
  isPinned: boolean
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (conversationDoc.exists()) {
    const data = conversationDoc.data();
    const pinnedBy = data.pinnedBy || [];
    
    if (isPinned) {
      if (!pinnedBy.includes(userId)) {
        pinnedBy.push(userId);
      }
    } else {
      const index = pinnedBy.indexOf(userId);
      if (index > -1) {
        pinnedBy.splice(index, 1);
      }
    }
    
    await updateDoc(conversationRef, { pinnedBy });
  }
};

// Archive/Unarchive conversation
export const toggleArchiveConversation = async (
  conversationId: string,
  userId: string,
  isArchived: boolean
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (conversationDoc.exists()) {
    const data = conversationDoc.data();
    const archivedBy = data.archivedBy || [];
    
    if (isArchived) {
      if (!archivedBy.includes(userId)) {
        archivedBy.push(userId);
      }
    } else {
      const index = archivedBy.indexOf(userId);
      if (index > -1) {
        archivedBy.splice(index, 1);
      }
    }
    
    await updateDoc(conversationRef, { archivedBy });
  }
};

// Mute/Unmute conversation
export const toggleMuteConversation = async (
  conversationId: string,
  userId: string,
  isMuted: boolean
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (conversationDoc.exists()) {
    const data = conversationDoc.data();
    const mutedBy = data.mutedBy || [];
    
    if (isMuted) {
      if (!mutedBy.includes(userId)) {
        mutedBy.push(userId);
      }
    } else {
      const index = mutedBy.indexOf(userId);
      if (index > -1) {
        mutedBy.splice(index, 1);
      }
    }
    
    await updateDoc(conversationRef, { mutedBy });
  }
};

// Delete message (soft delete)
export const deleteMessage = async (messageId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  await updateDoc(doc(db, "messages", messageId), {
    deleted: true,
    content: "This message was deleted",
  });
};

// Block user
export const blockUser = async (blockerId: string, blockedUserId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  await addDoc(collection(db, "blockedUsers"), {
    blockerId,
    blockedUserId,
    blockedAt: serverTimestamp(),
  });
};

// Unblock user
export const unblockUser = async (blockerId: string, blockedUserId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "blockedUsers"),
    where("blockerId", "==", blockerId),
    where("blockedUserId", "==", blockedUserId)
  );
  
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map((docSnap) =>
    updateDoc(doc(db!, "blockedUsers", docSnap.id), {
      unblocked: true,
      unblockedAt: serverTimestamp(),
    })
  );
  await Promise.all(promises);
};

// Check if user is blocked
export const isUserBlocked = async (userId: string, otherUserId: string): Promise<boolean> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "blockedUsers"),
    where("blockerId", "==", userId),
    where("blockedUserId", "==", otherUserId),
    where("unblocked", "!=", true)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Report conversation
export const reportConversation = async (
  conversationId: string,
  reporterId: string,
  reportedUserId: string,
  reason: string,
  description?: string
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  await addDoc(collection(db, "chatReports"), {
    conversationId,
    reporterId,
    reportedUserId,
    reason,
    description: description || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
};

// Clear conversation history
export const clearConversationHistory = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (conversationDoc.exists()) {
    const data = conversationDoc.data();
    const clearedBy = data.clearedBy || {};
    clearedBy[userId] = serverTimestamp();
    
    await updateDoc(conversationRef, { clearedBy });
  }
};

// Helper function to find a message document reference across all conversations
export const findMessageInConversations = async (
  messageId: string
): Promise<{ conversationId: string; messageRef: any } | null> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  try {
    // Query messages collection directly by ID
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (messageSnap.exists()) {
      const messageData = messageSnap.data() as any;
      return {
        conversationId: messageData.conversationId,
        messageRef,
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding message:", error);
    return null;
  }
};

// Get total unread message count for a user
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  try {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

// Subscribe to unread message count changes
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  if (!db) {
    throw new Error("Firestore is not initialized");
  }

  const q = query(
    collection(db, "messages"),
    where("receiverId", "==", userId),
    where("read", "==", false)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      console.error("Error subscribing to unread count:", error);
      callback(0);
    }
  );

  return unsubscribe;
};

