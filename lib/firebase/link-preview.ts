import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import { LinkPreview } from "../utils/link-preview";

// Cache link previews in Firestore to avoid refetching
export async function cacheLinkPreview(preview: LinkPreview): Promise<void> {
  if (!db) return;

  try {
    const previewRef = doc(db, "linkPreviews", encodeURIComponent(preview.url));
    await setDoc(previewRef, {
      ...preview,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  } catch (error) {
    console.error("Error caching link preview:", error);
  }
}

// Get cached link preview
export async function getCachedLinkPreview(
  url: string
): Promise<LinkPreview | null> {
  if (!db) return null;

  try {
    const previewRef = doc(db, "linkPreviews", encodeURIComponent(url));
    const previewSnap = await getDoc(previewRef);

    if (!previewSnap.exists()) {
      return null;
    }

    const data = previewSnap.data();
    
    // Check if cache is expired
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null;
    }

    return {
      url: data.url,
      title: data.title,
      description: data.description,
      image: data.image,
      siteName: data.siteName,
      favicon: data.favicon,
    };
  } catch (error) {
    console.error("Error getting cached link preview:", error);
    return null;
  }
}

// Associate link preview with a message
export async function attachLinkPreviewToMessage(
  messageId: string,
  preview: LinkPreview
): Promise<void> {
  if (!db) return;

  try {
    // Find the message in conversations
    const conversationsRef = collection(db, "conversations");
    const conversationsSnap = await getDocs(conversationsRef);

    for (const conversationDoc of conversationsSnap.docs) {
      const messagesRef = collection(
        db,
        "conversations",
        conversationDoc.id,
        "messages"
      );
      const messageRef = doc(messagesRef, messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        // Update message with link preview
        await setDoc(
          messageRef,
          {
            linkPreview: preview,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        break;
      }
    }
  } catch (error) {
    console.error("Error attaching link preview to message:", error);
  }
}

// Clean up expired link preview cache
export async function cleanExpiredLinkPreviews(): Promise<void> {
  if (!db) return;

  try {
    const previewsRef = collection(db, "linkPreviews");
    const expiredQuery = query(
      previewsRef,
      where("expiresAt", "<=", new Date())
    );
    
    const expiredSnap = await getDocs(expiredQuery);
    
    const deletePromises = expiredSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    
    console.log(`Cleaned up ${expiredSnap.size} expired link previews`);
  } catch (error) {
    console.error("Error cleaning expired link previews:", error);
  }
}
