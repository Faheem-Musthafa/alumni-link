"use client";

import { useState } from "react";
import { Download, FileText, Film, X, ZoomIn } from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/firebase/chat-media";

interface MediaMessageProps {
  type: "image" | "document"; // Video removed for Firebase Free Tier optimization
  url: string;
  thumbnailUrl?: string;
  filename?: string;
  size?: number;
  className?: string;
}

export function MediaMessage({
  type,
  url,
  thumbnailUrl,
  filename,
  size,
  className = "",
}: MediaMessageProps) {
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (type === "image") {
    return (
      <>
        <div className={`relative group ${className}`}>
          <img
            src={thumbnailUrl || url}
            alt="Shared image"
            className={`max-w-sm rounded-xl cursor-pointer transition-opacity ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setShowFullImage(true)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setShowFullImage(true)}
              className="p-2 bg-white/90 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
            >
              <ZoomIn className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Full image modal */}
        {showFullImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Download className="h-6 w-6 text-white" />
            </button>
            <img
              src={url}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // Document (Video removed for Firebase Free Tier optimization)
  return (
    <div
      className={`flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors max-w-sm ${className}`}
    >
      <div className="text-4xl shrink-0">{getFileIcon(filename || "")}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {filename || "Document"}
        </p>
        {size && (
          <p className="text-xs text-gray-500">{formatFileSize(size)}</p>
        )}
      </div>
      <button
        onClick={handleDownload}
        className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"
        title="Download file"
      >
        <Download className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}
