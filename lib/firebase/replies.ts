/**
 * Reply to Messages - Firebase Operations
 * Phase 3.2: Handle message replies and threading
 */

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { ChatMessage } from '@/types';

/**
 * Get the message being replied to
 * @param messageId - The ID of the message to fetch
 * @returns The message data or null
 */
export async function getReplyToMessage(messageId: string): Promise<ChatMessage | null> {
  try {
    const messageRef = doc(db!, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return null;
    }

    const data = messageSnap.data();
    return {
      id: messageSnap.id,
      conversationId: data.conversationId || '',
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      timestamp: data.timestamp?.toDate() || new Date(),
      read: data.read || false,
      messageType: data.messageType || 'text',
      status: data.status || 'sent',
      deleted: data.deleted || false,
      edited: data.edited || false,
      editedAt: data.editedAt?.toDate(),
      replyTo: data.replyTo,
      reactions: data.reactions || {},
      linkPreview: data.linkPreview,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      starred: data.starred || [],
      forwarded: data.forwarded || false,
      forwardedFrom: data.forwardedFrom,
      originalMessageId: data.originalMessageId,
    } as ChatMessage;
  } catch (error) {
    console.error('Error fetching reply message:', error);
    return null;
  }
}

/**
 * Reply to a message
 * @param originalMessageId - The message being replied to
 * @param replyContent - The reply message content
 * @param senderId - The user sending the reply
 * @param receiverId - The user receiving the reply
 * @param conversationId - The conversation ID
 * @returns The new message ID or error
 */
export async function replyToMessage(
  originalMessageId: string,
  replyContent: string,
  senderId: string,
  receiverId: string,
  conversationId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Verify original message exists
    const originalMessage = await getReplyToMessage(originalMessageId);
    if (!originalMessage) {
      return { success: false, error: 'Original message not found' };
    }

    // Create reply message (handled by chat.ts sendMessage function)
    // This function is mainly for validation and fetching
    return { success: true };
  } catch (error) {
    console.error('Error replying to message:', error);
    return { success: false, error: 'Failed to reply to message' };
  }
}

/**
 * Get all replies to a specific message
 * @param messageId - The message ID to get replies for
 * @returns Array of reply messages
 */
export async function getReplies(messageId: string): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db!, 'messages');
    const q = query(messagesRef, where('replyTo', '==', messageId));
    const snapshot = await getDocs(q);

    const replies: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        conversationId: data.conversationId || '',
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        read: data.read || false,
        messageType: data.messageType || 'text',
        status: data.status || 'sent',
        deleted: data.deleted || false,
        replyTo: data.replyTo,
        reactions: data.reactions || {},
      } as ChatMessage);
    });

    // Sort by timestamp
    replies.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return replies;
  } catch (error) {
    console.error('Error fetching replies:', error);
    return [];
  }
}
