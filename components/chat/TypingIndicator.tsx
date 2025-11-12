"use client";

import { motion } from "framer-motion";

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export function TypingIndicator({ userName, className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 py-2 px-4 ${className}`}>
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0,
          }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
      </div>
      <span className="text-sm text-gray-500 italic">
        {userName ? `${userName} is typing...` : "Typing..."}
      </span>
    </div>
  );
}
