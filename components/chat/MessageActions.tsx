/**
 * Message Actions Components
 * Phase 3.4: Multi-select UI, Star button, Forward dialog
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Forward,
  Check,
  X,
  ChevronRight,
  Search,
  User,
} from 'lucide-react';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';

// ===========================
// STAR BUTTON
// ===========================

interface StarButtonProps {
  isStarred: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function StarButton({ isStarred, onToggle, disabled }: StarButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isStarred ? 'Unstar message' : 'Star message'}
    >
      <Star
        className={`h-4 w-4 transition-all ${
          isStarred
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      />
    </button>
  );
}

// ===========================
// MULTI-SELECT BAR
// ===========================

interface MultiSelectBarProps {
  selectedCount: number;
  onCancel: () => void;
  onForward: () => void;
  canForward: boolean;
}

export function MultiSelectBar({
  selectedCount,
  onCancel,
  onForward,
  canForward,
}: MultiSelectBarProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            title="Cancel selection"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? 'message' : 'messages'} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onForward}
            disabled={!canForward}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title="Forward selected messages"
          >
            <Forward className="h-4 w-4" />
            Forward
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================
// MESSAGE CHECKBOX
// ===========================

interface MessageCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MessageCheckbox({
  isSelected,
  onToggle,
  disabled,
}: MessageCheckboxProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="shrink-0"
    >
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isSelected
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-600'
        }`}
      >
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </button>
    </motion.div>
  );
}

// ===========================
// FORWARD DIALOG
// ===========================

interface ForwardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (userId: string) => void;
  selectedCount: number;
  recentChats: Array<{
    userId: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
  }>;
}

export function ForwardDialog({
  isOpen,
  onClose,
  onForward,
  selectedCount,
  recentChats,
}: ForwardDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredChats = recentChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = () => {
    if (selectedUserId) {
      onForward(selectedUserId);
      onClose();
      setSelectedUserId(null);
      setSearchQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Forward {selectedCount} {selectedCount === 1 ? 'message' : 'messages'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No contacts found' : 'No recent chats'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredChats.map((chat) => (
                <button
                  key={chat.userId}
                  onClick={() => setSelectedUserId(chat.userId)}
                  className={`w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedUserId === chat.userId
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <UserAvatar
                    src={chat.avatar}
                    name={chat.name}
                    size="md"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {chat.name}
                    </p>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                  {selectedUserId === chat.userId && (
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={!selectedUserId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================
// FORWARDED INDICATOR
// ===========================

interface ForwardedIndicatorProps {
  forwardedFromName?: string;
}

export function ForwardedIndicator({ forwardedFromName }: ForwardedIndicatorProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
      <Forward className="h-3 w-3" />
      <span>
        Forwarded {forwardedFromName && `from ${forwardedFromName}`}
      </span>
    </div>
  );
}
