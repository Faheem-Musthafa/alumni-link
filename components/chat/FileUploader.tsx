"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadChatMedia, validateFile, formatFileSize } from "@/lib/firebase/chat-media";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  conversationId: string;
  userId: string;
  onUploadComplete: (data: {
    url: string;
    thumbnailUrl?: string;
    type: "image" | "document"; // Video removed for Firebase Free Tier
    filename: string;
    size: number;
  }) => void;
  onCancel: () => void;
}

export function FileUploader({
  conversationId,
  userId,
  onUploadComplete,
  onCancel,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type (video removed for Firebase Free Tier)
    let mediaType: "image" | "document" = "document";
    if (file.type.startsWith("image/")) mediaType = "image";

    // Validate file
    const validation = validateFile(file, mediaType);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (mediaType === "image") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let mediaType: "image" | "document" = "document";
      if (selectedFile.type.startsWith("image/")) mediaType = "image";

      const { url, thumbnailUrl } = await uploadChatMedia(
        selectedFile,
        conversationId,
        userId,
        mediaType,
        (progress) => setUploadProgress(progress)
      );

      onUploadComplete({
        url,
        thumbnailUrl,
        type: mediaType,
        filename: selectedFile.name,
        size: selectedFile.size,
      });

      toast({
        title: "Upload successful",
        description: `${selectedFile.name} uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-12 w-12 text-gray-400" />;

    if (selectedFile.type.startsWith("image/"))
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    return <FileText className="h-12 w-12 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={uploading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Click to select a file
            </p>
            <p className="text-xs text-gray-500">
              Images (max 5MB) • Documents (max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File preview */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-48">
                  {getFileIcon()}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-blue-600 font-medium">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Change File
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
