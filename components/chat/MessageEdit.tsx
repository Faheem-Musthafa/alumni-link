"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil, Clock } from "lucide-react";

interface MessageEditProps {
  originalContent: string;
  onSave: (newContent: string) => Promise<void>;
  onCancel: () => void;
  remainingTime?: number;
  className?: string;
}

export function MessageEdit({
  originalContent,
  onSave,
  onCancel,
  remainingTime,
  className = "",
}: MessageEditProps) {
  const [content, setContent] = useState(originalContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea and select all text
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Message cannot be empty");
      return;
    }

    if (content.trim() === originalContent.trim()) {
      setError("No changes made");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(content.trim());
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          rows={3}
          maxLength={2000}
          placeholder="Edit your message..."
        />
        
        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {content.length}/2000
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}

      {/* Remaining time */}
      {remainingTime !== undefined && remainingTime > 0 && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {Math.floor(remainingTime / 60)}m {remainingTime % 60}s remaining to edit
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              Save
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>

        <span className="text-xs text-gray-500 ml-2">
          Press Enter to save, Esc to cancel
        </span>
      </div>
    </div>
  );
}

interface EditedIndicatorProps {
  editedAt: Date;
  className?: string;
}

export function EditedIndicator({ editedAt, className = "" }: EditedIndicatorProps) {
  const formatEditTime = () => {
    const now = new Date();
    const diff = now.getTime() - editedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `Edited ${days}d ago`;
    } else if (hours > 0) {
      return `Edited ${hours}h ago`;
    } else if (minutes > 0) {
      return `Edited ${minutes}m ago`;
    } else {
      return "Edited just now";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-gray-500 italic ${className}`}
      title={`Edited at ${editedAt.toLocaleString()}`}
    >
      <Pencil className="h-2.5 w-2.5" />
      {formatEditTime()}
    </span>
  );
}
