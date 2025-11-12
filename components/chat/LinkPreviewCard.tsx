"use client";

import { useState } from "react";
import { ExternalLink, Globe, X } from "lucide-react";
import { LinkPreview as LinkPreviewType } from "@/lib/utils/link-preview";

interface LinkPreviewCardProps {
  preview: LinkPreviewType;
  onClose?: () => void;
  className?: string;
}

export function LinkPreviewCard({
  preview,
  onClose,
  className = "",
}: LinkPreviewCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLinkClick = () => {
    window.open(preview.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 transition-all cursor-pointer group bg-white ${className}`}
      onClick={handleLinkClick}
    >
      {/* Close button for edit mode */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white rounded-full shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Preview Image */}
      {preview.image && !imageError && (
        <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={preview.image}
            alt={preview.title || "Link preview"}
            className={`w-full h-full object-cover transition-opacity ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Site name with favicon */}
        <div className="flex items-center gap-2">
          {preview.favicon ? (
            <img
              src={preview.favicon}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Globe className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-xs text-gray-500 truncate">
            {preview.siteName || new URL(preview.url).hostname.replace("www.", "")}
          </span>
          <ExternalLink className="h-3 w-3 text-gray-400 ml-auto shrink-0" />
        </div>

        {/* Title */}
        {preview.title && (
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {preview.title}
          </h4>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {preview.description}
          </p>
        )}

        {/* URL */}
        <p className="text-xs text-blue-600 truncate group-hover:underline">
          {preview.url}
        </p>
      </div>
    </div>
  );
}

// Compact version for inline display
export function LinkPreviewCompact({
  preview,
  className = "",
}: {
  preview: LinkPreviewType;
  className?: string;
}) {
  const handleLinkClick = () => {
    window.open(preview.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer ${className}`}
      onClick={handleLinkClick}
    >
      {/* Thumbnail or Favicon */}
      <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {preview.image ? (
          <img
            src={preview.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : preview.favicon ? (
          <img src={preview.favicon} alt="" className="w-6 h-6" />
        ) : (
          <Globe className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {preview.title || "Link Preview"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {new URL(preview.url).hostname.replace("www.", "")}
        </p>
      </div>

      <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
    </div>
  );
}
