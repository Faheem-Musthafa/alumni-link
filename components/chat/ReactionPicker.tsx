"use client";

import { useState } from "react";
import { POPULAR_REACTIONS } from "@/lib/firebase/reactions";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}

export function ReactionPicker({
  onSelect,
  onClose,
  position = "top",
}: ReactionPickerProps) {
  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: position === "top" ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: position === "top" ? 10 : -10 }}
        transition={{ duration: 0.15 }}
        className={`absolute ${
          position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } left-0 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1 z-50`}
      >
        {POPULAR_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className="text-2xl hover:scale-125 active:scale-110 transition-transform duration-150 p-1.5 rounded-full hover:bg-gray-100"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

interface ReactionBubbleProps {
  emoji: string;
  count: number;
  users: Array<{ userId: string; userName: string; timestamp: Date }>;
  hasReacted: boolean;
  onClick: () => void;
  onHover?: () => void;
}

export function ReactionBubble({
  emoji,
  count,
  users,
  hasReacted,
  onClick,
  onHover,
}: ReactionBubbleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        onMouseEnter={() => {
          setShowTooltip(true);
          onHover?.();
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
          hasReacted
            ? "bg-blue-100 border border-blue-400 text-blue-700"
            : "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span className="text-sm">{emoji}</span>
        <span>{count}</span>
      </motion.button>

      {/* Tooltip showing who reacted */}
      {showTooltip && users.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
        >
          <div className="space-y-0.5">
            {users.slice(0, 5).map((user) => (
              <div key={user.userId}>{user.userName}</div>
            ))}
            {users.length > 5 && (
              <div className="text-gray-400">
                +{users.length - 5} more
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface ReactionListProps {
  reactions: Record<
    string,
    { count: number; users: Array<{ userId: string; userName: string; timestamp: Date }> }
  >;
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
  className?: string;
}

export function ReactionList({
  reactions,
  currentUserId,
  onReactionClick,
  className = "",
}: ReactionListProps) {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${className}`}>
      <AnimatePresence mode="popLayout">
        {Object.entries(reactions)
          .sort((a, b) => b[1].count - a[1].count) // Sort by count
          .map(([emoji, data]) => {
            const hasReacted = data.users.some(
              (u) => u.userId === currentUserId
            );

            return (
              <ReactionBubble
                key={emoji}
                emoji={emoji}
                count={data.count}
                users={data.users}
                hasReacted={hasReacted}
                onClick={() => onReactionClick(emoji)}
              />
            );
          })}
      </AnimatePresence>
    </div>
  );
}
