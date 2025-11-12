"use client";

import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageStatusProps {
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  className?: string;
}

export function MessageStatus({ status = "sent", className = "" }: MessageStatusProps) {
  switch (status) {
    case "sending":
      return <Clock className={`h-4 w-4 text-gray-400 ${className}`} />;
    
    case "sent":
      return <Check className={`h-4 w-4 text-gray-400 ${className}`} />;
    
    case "delivered":
      return <CheckCheck className={`h-4 w-4 text-gray-400 ${className}`} />;
    
    case "read":
      return <CheckCheck className={`h-4 w-4 text-blue-500 ${className}`} />;
    
    case "failed":
      return (
        <svg
          className={`h-4 w-4 text-red-500 ${className}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    
    default:
      return null;
  }
}
