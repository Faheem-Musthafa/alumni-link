import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  DocumentSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";
import { Post, PostLike, PostComment, PostType, UserRole } from "@/types";

export type { PostType };

const POSTS_COLLECTION = "posts";
const POST_LIKES_COLLECTION = "postLikes";
const POST_COMMENTS_COLLECTION = "postComments";
const COMMENT_LIKES_COLLECTION = "commentLikes";

// ==================== POST OPERATIONS ====================

interface CreatePostData {
  content: string;
  postType: PostType;
  images?: File[];
  hashtags?: string[];
  mentions?: string[];
  visibility?: "public" | "connections" | "college";
  college?: string;
}

interface AuthorInfo {
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorRole?: UserRole;
  authorJobTitle?: string;
  authorCompany?: string;
}

export async function createPost(
  authorInfo: AuthorInfo,
  data: CreatePostData
): Promise<string> {
  if (!db || !storage) throw new Error("Firebase is not initialized");

  try {
    // Upload images if any
    let imageUrls: string[] = [];
    let thumbnailUrls: string[] = [];

    if (data.images && data.images.length > 0) {
      const uploadPromises = data.images.map(async (file, index) => {
        const timestamp = Date.now();
        const path = `posts/${authorInfo.authorId}/${timestamp}_${index}_${file.name}`;
        const storageRef = ref(storage!, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
      });

      imageUrls = await Promise.all(uploadPromises);
      thumbnailUrls = imageUrls; // For simplicity, use same URLs. Could generate thumbnails.
    }

    // Extract hashtags from content if not provided
    const extractedHashtags = data.content.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [];
    const hashtags = data.hashtags || extractedHashtags;

    // Build post data, excluding undefined fields
    const postData: Record<string, unknown> = {
      ...authorInfo,
      content: data.content,
      postType: data.postType,
      images: imageUrls,
      thumbnails: thumbnailUrls,
      hashtags,
      mentions: data.mentions || [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      visibility: data.visibility || "public",
      status: "active",
      isPinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add college if it's defined
    if (data.college) {
      postData.college = data.college;
    }

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function updatePost(
  postId: string,
  data: Partial<Pick<Post, "content" | "postType" | "visibility" | "hashtags">>
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    // Soft delete by updating status
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      status: "deleted",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

export async function getPost(postId: string): Promise<Post | null> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return null;

    return { id: postSnap.id, ...postSnap.data() } as Post;
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
}

export async function getPosts(options?: {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
  authorId?: string;
  college?: string;
  postType?: PostType;
}): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const constraints: QueryConstraint[] = [
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
    ];

    if (options?.authorId) {
      constraints.unshift(where("authorId", "==", options.authorId));
    }

    if (options?.college) {
      constraints.unshift(where("college", "==", options.college));
    }

    if (options?.postType) {
      constraints.unshift(where("postType", "==", options.postType));
    }

    if (options?.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }

    constraints.push(limit(options?.limitCount || 10));

    const q = query(collection(db, POSTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const posts: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { posts, lastDoc };
  } catch (error) {
    console.error("Error getting posts:", error);
    throw error;
  }
}

export function subscribeToFeed(
  callback: (posts: Post[]) => void,
  options?: { college?: string; limitCount?: number }
): () => void {
  if (!db) throw new Error("Firestore is not initialized");

  const constraints: QueryConstraint[] = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(options?.limitCount || 20),
  ];

  if (options?.college) {
    constraints.unshift(where("college", "==", options.college));
  }

  const q = query(collection(db, POSTS_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const posts: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
    callback(posts);
  });
}

// ==================== LIKE OPERATIONS ====================

export type ReactionType = "like" | "celebrate" | "support" | "love" | "insightful" | "curious";

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  celebrate: "🎉",
  support: "💪",
  love: "❤️",
  insightful: "💡",
  curious: "🤔",
};

export async function likePost(
  postId: string,
  userId: string,
  userName: string,
  userPhotoURL?: string,
  reaction: ReactionType = "like"
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    // Check if already liked
    const existingLike = await getUserPostLike(postId, userId);
    
    if (existingLike) {
      // Update reaction type
      const likeRef = doc(db, POST_LIKES_COLLECTION, existingLike.id);
      await updateDoc(likeRef, { reaction });
      return;
    }

    // Create new like
    await addDoc(collection(db, POST_LIKES_COLLECTION), {
      postId,
      userId,
      userName,
      userPhotoURL,
      reaction,
      createdAt: serverTimestamp(),
    });

    // Increment post likes count
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      likesCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const existingLike = await getUserPostLike(postId, userId);
    
    if (!existingLike) return;

    await deleteDoc(doc(db, POST_LIKES_COLLECTION, existingLike.id));

    // Decrement post likes count
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      likesCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    throw error;
  }
}

export async function getUserPostLike(
  postId: string,
  userId: string
): Promise<PostLike | null> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const q = query(
      collection(db, POST_LIKES_COLLECTION),
      where("postId", "==", postId),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PostLike;
  } catch (error) {
    console.error("Error getting user post like:", error);
    return null;
  }
}

export async function getPostLikes(postId: string): Promise<PostLike[]> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const q = query(
      collection(db, POST_LIKES_COLLECTION),
      where("postId", "==", postId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PostLike[];
  } catch (error) {
    console.error("Error getting post likes:", error);
    return [];
  }
}

// ==================== COMMENT OPERATIONS ====================

export async function addComment(
  postId: string,
  authorId: string,
  authorName: string,
  content: string,
  authorPhotoURL?: string,
  authorRole?: UserRole,
  parentCommentId?: string
): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const commentData = {
      postId,
      authorId,
      authorName,
      authorPhotoURL,
      authorRole,
      content,
      parentCommentId: parentCommentId || null,
      likesCount: 0,
      repliesCount: 0,
      isEdited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, POST_COMMENTS_COLLECTION), commentData);

    // Increment post comments count
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // If this is a reply, increment parent's repliesCount
    if (parentCommentId) {
      const parentRef = doc(db, POST_COMMENTS_COLLECTION, parentCommentId);
      await updateDoc(parentRef, {
        repliesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const commentRef = doc(db, POST_COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      content,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    await deleteDoc(doc(db, POST_COMMENTS_COLLECTION, commentId));

    // Decrement post comments count
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export async function getPostComments(
  postId: string,
  parentCommentId?: string | null
): Promise<PostComment[]> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const constraints: QueryConstraint[] = [
      where("postId", "==", postId),
      orderBy("createdAt", "asc"),
    ];

    if (parentCommentId === null || parentCommentId === undefined) {
      // Get top-level comments only
      constraints.unshift(where("parentCommentId", "==", null));
    } else {
      // Get replies to a specific comment
      constraints.unshift(where("parentCommentId", "==", parentCommentId));
    }

    const q = query(collection(db, POST_COMMENTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PostComment[];
  } catch (error) {
    console.error("Error getting post comments:", error);
    return [];
  }
}

export function subscribeToPostComments(
  postId: string,
  callback: (comments: PostComment[]) => void
): () => void {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, POST_COMMENTS_COLLECTION),
    where("postId", "==", postId),
    where("parentCommentId", "==", null),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments: PostComment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PostComment[];
    callback(comments);
  });
}

// ==================== COMMENT LIKE OPERATIONS ====================

export async function likeComment(
  commentId: string,
  userId: string,
  userName: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    // Check if already liked
    const q = query(
      collection(db, COMMENT_LIKES_COLLECTION),
      where("commentId", "==", commentId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) return; // Already liked

    await addDoc(collection(db, COMMENT_LIKES_COLLECTION), {
      commentId,
      userId,
      userName,
      createdAt: serverTimestamp(),
    });

    // Increment comment likes count
    const commentRef = doc(db, POST_COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      likesCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const q = query(
      collection(db, COMMENT_LIKES_COLLECTION),
      where("commentId", "==", commentId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    await deleteDoc(doc(db, COMMENT_LIKES_COLLECTION, snapshot.docs[0].id));

    // Decrement comment likes count
    const commentRef = doc(db, POST_COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      likesCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
}

export async function hasUserLikedComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const q = query(
      collection(db, COMMENT_LIKES_COLLECTION),
      where("commentId", "==", commentId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking comment like:", error);
    return false;
  }
}

// ==================== UPLOAD HELPER ====================

export async function uploadPostImage(
  file: File,
  userId: string
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized");

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error("Image size must be less than 5MB");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed");
  }

  const timestamp = Date.now();
  const path = `posts/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
