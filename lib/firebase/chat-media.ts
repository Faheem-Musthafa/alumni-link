import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./config";
import imageCompression from "browser-image-compression";

// File size limits (in bytes) - Optimized for Firebase Free Tier
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB (reduced from 10MB)
  document: 10 * 1024 * 1024, // 10MB (reduced from 25MB)
  voice: 3 * 1024 * 1024, // 3MB (reduced from 5MB)
};

// Allowed file types - NO VIDEO (too large for free tier)
export const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
  voice: ["audio/webm", "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg"],
};

// Compress image before upload
export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1, // Max file size 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    quality: 0.75, // 75% quality
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // Return original if compression fails
  }
};

// Generate thumbnail for image
export const generateThumbnail = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, // 100KB thumbnail
    maxWidthOrHeight: 200,
    useWebWorker: true,
    quality: 0.6,
  };

  try {
    const thumbnail = await imageCompression(file, options);
    return thumbnail;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return file;
  }
};

// Validate file type and size
export const validateFile = (
  file: File,
  type: "image" | "document" | "voice"
): { valid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_FILE_TYPES[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES[type].join(", ")}`,
    };
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMITS[type]) {
    const limitMB = FILE_SIZE_LIMITS[type] / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${limitMB}MB`,
    };
  }

  return { valid: true };
};

// Upload file to Firebase Storage with progress tracking
export const uploadChatMedia = async (
  file: File,
  conversationId: string,
  userId: string,
  mediaType: "image" | "document" | "voice",
  onProgress?: (progress: number) => void
): Promise<{ url: string; thumbnailUrl?: string }> => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized");
  }

  // Validate file
  const validation = validateFile(file, mediaType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let fileToUpload = file;
  let thumbnailUrl: string | undefined;

  // Compress images
  if (mediaType === "image") {
    fileToUpload = await compressImage(file);

    // Generate and upload thumbnail
    try {
      const thumbnail = await generateThumbnail(file);
      const thumbnailPath = `chat/${conversationId}/${userId}/thumbnails/${Date.now()}_${thumbnail.name}`;
      const thumbnailRef = ref(storage, thumbnailPath);
      const thumbnailSnapshot = await uploadBytesResumable(thumbnailRef, thumbnail);
      thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
    }
  }

  // Upload main file
  const filePath = `chat/${conversationId}/${userId}/${Date.now()}_${fileToUpload.name}`;
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            thumbnailUrl,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// Delete file from Firebase Storage
export const deleteChatMedia = async (fileUrl: string): Promise<void> => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized");
  }

  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// Get file extension from URL
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

// Get file icon based on extension
export const getFileIcon = (filename: string): string => {
  const ext = getFileExtension(filename);
  const iconMap: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    txt: "📃",
    zip: "🗜️",
    rar: "🗜️",
    default: "📎",
  };

  return iconMap[ext] || iconMap.default;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};
