/**
 * Message Actions - Forward & Star Messages
 * Phase 3.4: Multi-select, forwarding, and starring functionality
 */

import {
  collection,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { ChatMessage } from '@/types';

// ===========================
// STAR MESSAGES
// ===========================

/**
 * Toggle star status on a message
 * @param messageId - Message ID to star/unstar
 * @param userId - Current user ID
 * @param currentStarred - Current starred status
 * @returns Success status
 */
export async function toggleStarMessage(
  messageId: string,
  userId: string,
  currentStarred: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageRef = doc(db!, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return { success: false, error: 'Message not found' };
    }

    const message = messageSnap.data();

    // Only sender or receiver can star messages
    if (message.senderId !== userId && message.receiverId !== userId) {
      return { success: false, error: 'Not authorized to star this message' };
    }

    // Update starred status
    const starred = (message.starred || []) as string[];
    const newStarred = currentStarred
      ? starred.filter((id) => id !== userId)
      : [...starred, userId];

    await updateDoc(messageRef, {
      starred: newStarred,
      lastStarredAt: currentStarred ? null : serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error toggling star:', error);
    return { success: false, error: 'Failed to star message' };
  }
}

/**
 * Get all starred messages for a user
 * @param userId - Current user ID
 * @returns Array of starred messages
 */
export async function getStarredMessages(
  userId: string
): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db!, 'messages');
    const q = query(
      messagesRef,
      where('starred', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
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
        edited: data.edited || false,
        editedAt: data.editedAt?.toDate(),
        replyTo: data.replyTo,
        reactions: data.reactions || {},
        linkPreview: data.linkPreview,
        mediaUrl: data.mediaUrl,
        thumbnailUrl: data.thumbnailUrl,
        starred: data.starred || [],
        lastStarredAt: data.lastStarredAt?.toDate(),
      } as ChatMessage);
    });

    // Sort by last starred time (most recent first)
    messages.sort((a, b) => {
      const aTime = a.lastStarredAt?.getTime() || 0;
      const bTime = b.lastStarredAt?.getTime() || 0;
      return bTime - aTime;
    });

    return messages;
  } catch (error) {
    console.error('Error getting starred messages:', error);
    return [];
  }
}

/**
 * Check if a message is starred by the current user
 * @param message - Message to check
 * @param userId - Current user ID
 * @returns Whether the message is starred by this user
 */
export function isMessageStarred(message: ChatMessage, userId: string): boolean {
  return (message.starred || []).includes(userId);
}

// ===========================
// FORWARD MESSAGES
// ===========================

/**
 * Forward a single message to another user
 * @param messageId - Message ID to forward
 * @param targetUserId - User to forward to
 * @param currentUserId - Current user ID
 * @returns New message ID or error
 */
export async function forwardMessage(
  messageId: string,
  targetUserId: string,
  currentUserId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get original message
    const messageRef = doc(db!, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return { success: false, error: 'Message not found' };
    }

    const originalMessage = messageSnap.data();

    // Only sender or receiver can forward
    if (
      originalMessage.senderId !== currentUserId &&
      originalMessage.receiverId !== currentUserId
    ) {
      return { success: false, error: 'Not authorized to forward this message' };
    }

    // Cannot forward deleted messages
    if (originalMessage.deleted) {
      return { success: false, error: 'Cannot forward deleted messages' };
    }

    // Create new message with forwarded flag
    const messagesRef = collection(db!, 'messages');
    const newMessage = {
      conversationId: `${[currentUserId, targetUserId].sort().join('_')}`,
      senderId: currentUserId,
      receiverId: targetUserId,
      content: originalMessage.content,
      timestamp: serverTimestamp(),
      read: false,
      messageType: originalMessage.messageType || 'text',
      status: 'sent',
      deleted: false,
      forwarded: true,
      forwardedFrom: originalMessage.senderId,
      originalMessageId: messageId,
      // Preserve media if exists
      ...(originalMessage.mediaUrl && {
        mediaUrl: originalMessage.mediaUrl,
        thumbnailUrl: originalMessage.thumbnailUrl,
        mediaSize: originalMessage.mediaSize,
        mediaType: originalMessage.mediaType,
      }),
      // Preserve link preview if exists
      ...(originalMessage.linkPreview && {
        linkPreview: originalMessage.linkPreview,
      }),
    };

    const docRef = await addDoc(messagesRef, newMessage);

    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error('Error forwarding message:', error);
    return { success: false, error: 'Failed to forward message' };
  }
}

/**
 * Forward multiple messages to another user
 * @param messageIds - Array of message IDs to forward
 * @param targetUserId - User to forward to
 * @param currentUserId - Current user ID
 * @returns Success count and errors
 */
export async function forwardMultipleMessages(
  messageIds: string[],
  targetUserId: string,
  currentUserId: string
): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
  const results = {
    successCount: 0,
    failedCount: 0,
    errors: [] as string[],
  };

  for (const messageId of messageIds) {
    const result = await forwardMessage(messageId, targetUserId, currentUserId);
    if (result.success) {
      results.successCount++;
    } else {
      results.failedCount++;
      results.errors.push(result.error || 'Unknown error');
    }
  }

  return results;
}

// ===========================
// MULTI-SELECT HELPERS
// ===========================

/**
 * Check if a message can be forwarded
 * @param message - Message to check
 * @returns Whether the message can be forwarded
 */
export function canForwardMessage(message: ChatMessage): boolean {
  // Cannot forward deleted messages
  if (message.deleted) return false;

  // Can forward text, images, documents, and links
  const forwardableTypes: ChatMessage['messageType'][] = ['text', 'image', 'document'];
  return forwardableTypes.includes(message.messageType);
}

/**
 * Get forwardable messages from a selection
 * @param messages - Array of messages to filter
 * @returns Array of forwardable messages
 */
export function getForwardableMessages(
  messages: ChatMessage[]
): ChatMessage[] {
  return messages.filter(canForwardMessage);
}
