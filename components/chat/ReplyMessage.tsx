"use client";

import { X, Reply, CornerDownRight } from "lucide-react";
import { ChatMessage } from "@/types";

interface ReplyPreviewProps {
  message: ChatMessage;
  senderName: string;
  onClose: () => void;
  className?: string;
}

export function ReplyPreview({
  message,
  senderName,
  onClose,
  className = "",
}: ReplyPreviewProps) {
  const getPreviewText = () => {
    if (message.messageType === "image") return "📷 Image";
    if (message.messageType === "document") return "📎 Document";
    if (message.messageType === "voice") return "🎤 Voice message";
    if (message.content.length > 50) {
      return message.content.substring(0, 50) + "...";
    }
    return message.content;
  };

  return (
    <div
      className={`flex items-center gap-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-3 shadow-sm ${className}`}
    >
      <Reply className="h-4 w-4 text-blue-600 shrink-0" />
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-700 mb-0.5">
          Replying to {senderName}
        </p>
        <p className="text-sm text-gray-800 truncate">{getPreviewText()}</p>
      </div>

      <button
        onClick={onClose}
        className="p-1 hover:bg-blue-100 rounded-full transition-colors shrink-0"
        aria-label="Cancel reply"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

interface QuotedMessageProps {
  message: ChatMessage;
  senderName: string;
  onClick?: () => void;
  isOwnMessage?: boolean;
  className?: string;
}

export function QuotedMessage({
  message,
  senderName,
  onClick,
  isOwnMessage = false,
  className = "",
}: QuotedMessageProps) {
  const getPreviewText = () => {
    if (message.messageType === "image") return "📷 Image";
    if (message.messageType === "document") return "📎 Document";
    if (message.messageType === "voice") return "🎤 Voice message";
    if (message.content.length > 100) {
      return message.content.substring(0, 100) + "...";
    }
    return message.content;
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-2 p-2.5 mb-2 rounded-lg border-l-4 transition-all bg-white/95 border-gray-400 hover:bg-white ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <CornerDownRight
        className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-600"
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-1 text-gray-900">
          {senderName}
        </p>
        <p className="text-xs line-clamp-2 text-gray-700 font-medium">
          {getPreviewText()}
        </p>
      </div>
    </div>
  );
}

interface ReplyIndicatorProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export function ReplyIndicator({
  count = 0,
  onClick,
  className = "",
}: ReplyIndicatorProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors ${className}`}
    >
      <CornerDownRight className="h-3 w-3" />
      <span>{count} {count === 1 ? "reply" : "replies"}</span>
    </button>
  );
}
