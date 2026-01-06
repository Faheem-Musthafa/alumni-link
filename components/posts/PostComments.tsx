"use client";

import { useState, useEffect, useRef } from "react";
import { PostComment, UserRole } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ActionButton } from "@/components/ui/action-button";
import { Textarea } from "@/components/ui/textarea";
import {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  hasUserLikedComment,
  subscribeToPostComments,
} from "@/lib/firebase/posts";
import { formatRelativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  CornerDownRight,
  Loader2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCommentsProps {
  postId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhoto?: string;
  currentUserRole?: UserRole;
  isOpen: boolean;
}

export function PostComments({
  postId,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  currentUserRole,
  isOpen,
}: PostCommentsProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, PostComment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Subscribe to comments
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToPostComments(postId, (newComments) => {
      setComments(newComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, isOpen]);

  // Check which comments user has liked
  useEffect(() => {
    if (!currentUserId || comments.length === 0) return;

    const checkLikes = async () => {
      const likedSet = new Set<string>();
      await Promise.all(
        comments.map(async (comment) => {
          const isLiked = await hasUserLikedComment(comment.id, currentUserId);
          if (isLiked) likedSet.add(comment.id);
        })
      );
      setLikedComments(likedSet);
    };

    checkLikes();
  }, [comments, currentUserId]);

  const handleSubmitComment = async () => {
    if (!currentUserId || !currentUserName || !newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(
        postId,
        currentUserId,
        currentUserName,
        newComment.trim(),
        currentUserPhoto,
        currentUserRole
      );
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Failed to add comment",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!currentUserId || !currentUserName || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      await addComment(
        postId,
        currentUserId,
        currentUserName,
        replyContent.trim(),
        currentUserPhoto,
        currentUserRole,
        parentCommentId
      );
      setReplyContent("");
      setReplyingTo(null);
      
      // Refresh replies for this comment
      loadReplies(parentCommentId);
      
      toast({
        title: "Reply added",
        description: "Your reply has been posted",
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      toast({
        title: "Failed to add reply",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Failed to update comment",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, postId);
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Failed to delete comment",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId || !currentUserName) return;

    const isLiked = likedComments.has(commentId);
    
    // Optimistic update
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    try {
      if (isLiked) {
        await unlikeComment(commentId, currentUserId);
      } else {
        await likeComment(commentId, currentUserId, currentUserName);
      }
    } catch (error) {
      // Revert on error
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });
      console.error("Error toggling comment like:", error);
    }
  };

  const loadReplies = async (commentId: string) => {
    setLoadingReplies((prev) => new Set(prev).add(commentId));
    try {
      const commentReplies = await getPostComments(postId, commentId);
      setReplies((prev) => ({ ...prev, [commentId]: commentReplies }));
      setExpandedReplies((prev) => new Set(prev).add(commentId));
    } catch (error) {
      console.error("Error loading replies:", error);
    } finally {
      setLoadingReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border-t bg-gray-50">
      {/* Comment Input */}
      {currentUserId && (
        <div className="p-4 border-b bg-white">
          <div className="flex items-start gap-3">
            <UserAvatar
              src={currentUserPhoto}
              name={currentUserName}
              size="sm"
            />
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] pr-12 rounded-xl resize-none"
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className={cn(
                  "absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  newComment.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="font-medium">No comments yet</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        ) : (
          <div className="divide-y">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isLiked={likedComments.has(comment.id)}
                isEditing={editingComment === comment.id}
                editContent={editContent}
                isReplyingTo={replyingTo === comment.id}
                replyContent={replyContent}
                replies={replies[comment.id] || []}
                isLoadingReplies={loadingReplies.has(comment.id)}
                isRepliesExpanded={expandedReplies.has(comment.id)}
                submitting={submitting}
                onLike={() => handleLikeComment(comment.id)}
                onReply={() => {
                  setReplyingTo(comment.id);
                  setReplyContent("");
                }}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                onReplyContentChange={setReplyContent}
                onSubmitReply={() => handleSubmitReply(comment.id)}
                onEdit={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                onCancelEdit={() => {
                  setEditingComment(null);
                  setEditContent("");
                }}
                onEditContentChange={setEditContent}
                onSubmitEdit={() => handleUpdateComment(comment.id)}
                onDelete={() => handleDeleteComment(comment.id)}
                onLoadReplies={() => loadReplies(comment.id)}
                likedComments={likedComments}
                onLikeReply={(replyId) => handleLikeComment(replyId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: PostComment;
  currentUserId?: string;
  isLiked: boolean;
  isEditing: boolean;
  editContent: string;
  isReplyingTo: boolean;
  replyContent: string;
  replies: PostComment[];
  isLoadingReplies: boolean;
  isRepliesExpanded: boolean;
  submitting: boolean;
  onLike: () => void;
  onReply: () => void;
  onCancelReply: () => void;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (value: string) => void;
  onSubmitEdit: () => void;
  onDelete: () => void;
  onLoadReplies: () => void;
  likedComments: Set<string>;
  onLikeReply: (replyId: string) => void;
}

function CommentItem({
  comment,
  currentUserId,
  isLiked,
  isEditing,
  editContent,
  isReplyingTo,
  replyContent,
  replies,
  isLoadingReplies,
  isRepliesExpanded,
  submitting,
  onLike,
  onReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  onEdit,
  onCancelEdit,
  onEditContentChange,
  onSubmitEdit,
  onDelete,
  onLoadReplies,
  likedComments,
  onLikeReply,
}: CommentItemProps) {
  const isOwner = currentUserId === comment.authorId;

  return (
    <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <UserAvatar
          src={comment.authorPhotoURL}
          name={comment.authorName}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {comment.authorName}
                </span>
                {comment.authorRole && (
                  <span className="text-xs text-gray-500 capitalize">
                    • {comment.authorRole}
                  </span>
                )}
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className="min-h-[60px] text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <ActionButton size="sm" variant="outline" onClick={onCancelEdit}>
                    Cancel
                  </ActionButton>
                  <ActionButton size="sm" onClick={onSubmitEdit} disabled={!editContent.trim()}>
                    Save
                  </ActionButton>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={onLike}
              disabled={!currentUserId}
              className={cn(
                "text-xs font-medium transition-colors",
                isLiked ? "text-blue-600" : "text-gray-500 hover:text-gray-700",
                !currentUserId && "cursor-not-allowed opacity-50"
              )}
            >
              {isLiked ? "Liked" : "Like"}
              {comment.likesCount > 0 && ` (${comment.likesCount})`}
            </button>
            
            {currentUserId && (
              <button
                onClick={onReply}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Reply
              </button>
            )}
            
            <span className="text-xs text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
            
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {/* Reply Input */}
          {isReplyingTo && (
            <div className="mt-3 flex items-start gap-2">
              <CornerDownRight className="h-4 w-4 text-gray-400 mt-3" />
              <div className="flex-1 relative">
                <Textarea
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className="min-h-[60px] text-sm pr-20"
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button
                    onClick={onCancelReply}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={onSubmitReply}
                    disabled={submitting || !replyContent.trim()}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                      replyContent.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Replies */}
          {comment.repliesCount > 0 && !isRepliesExpanded && (
            <button
              onClick={onLoadReplies}
              className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-2"
            >
              {isLoadingReplies ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading replies...
                </>
              ) : (
                <>
                  <CornerDownRight className="h-4 w-4" />
                  View {comment.repliesCount} {comment.repliesCount === 1 ? "reply" : "replies"}
                </>
              )}
            </button>
          )}

          {/* Replies List */}
          {isRepliesExpanded && replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-2">
                  <UserAvatar
                    src={reply.authorPhotoURL}
                    name={reply.authorName}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-xl px-3 py-2">
                      <span className="font-semibold text-gray-900 text-xs">
                        {reply.authorName}
                      </span>
                      <p className="text-gray-800 text-sm">{reply.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <button
                        onClick={() => onLikeReply(reply.id)}
                        disabled={!currentUserId}
                        className={cn(
                          "text-xs font-medium transition-colors",
                          likedComments.has(reply.id) ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {likedComments.has(reply.id) ? "Liked" : "Like"}
                        {reply.likesCount > 0 && ` (${reply.likesCount})`}
                      </button>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
