"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Post, UserRole } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  likePost,
  unlikePost,
  getUserPostLike,
  REACTION_EMOJIS,
  ReactionType,
} from "@/lib/firebase/posts";
import { formatRelativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trophy,
  Megaphone,
  FileText,
  Target,
  Bookmark,
  Flag,
  Trash2,
  Edit,
  ExternalLink,
  Users,
} from "lucide-react";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  currentUserPhoto?: string;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  className?: string;
}

const POST_TYPE_ICONS: Record<string, React.ElementType> = {
  achievement: Trophy,
  announcement: Megaphone,
  article: FileText,
  milestone: Target,
  general: FileText,
};

const POST_TYPE_COLORS: Record<string, string> = {
  achievement: "from-yellow-500 to-orange-500",
  announcement: "from-blue-500 to-cyan-500",
  article: "from-purple-500 to-pink-500",
  milestone: "from-green-500 to-emerald-500",
  general: "from-gray-500 to-slate-500",
};

const ROLE_BADGES: Record<UserRole, { label: string; color: string }> = {
  student: { label: "Student", color: "bg-blue-100 text-blue-700" },
  alumni: { label: "Alumni", color: "bg-purple-100 text-purple-700" },
  mentor: { label: "Mentor", color: "bg-green-100 text-green-700" },
  aspirant: { label: "Aspirant", color: "bg-orange-100 text-orange-700" },
  admin: { label: "Admin", color: "bg-red-100 text-red-700" },
};

export function PostCard({
  post,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  onCommentClick,
  onShareClick,
  onDeleteClick,
  onEditClick,
  className,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const isOwner = currentUserId === post.authorId;
  const PostTypeIcon = POST_TYPE_ICONS[post.postType] || FileText;

  useEffect(() => {
    if (currentUserId) {
      getUserPostLike(post.id, currentUserId).then((like) => {
        if (like) {
          setLiked(true);
          setCurrentReaction(like.reaction);
        }
      });
    }
  }, [post.id, currentUserId]);

  const handleLike = async (reaction: ReactionType = "like") => {
    if (!currentUserId || !currentUserName || isLiking) return;

    setIsLiking(true);
    try {
      if (liked && currentReaction === reaction) {
        // Unlike
        await unlikePost(post.id, currentUserId);
        setLiked(false);
        setCurrentReaction(null);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like or change reaction
        const wasLiked = liked;
        await likePost(post.id, currentUserId, currentUserName, currentUserPhoto, reaction);
        setLiked(true);
        setCurrentReaction(reaction);
        if (!wasLiked) {
          setLikeCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
      setShowReactionPicker(false);
    }
  };

  const getReactionIcon = () => {
    if (!currentReaction) return <ThumbsUp className="h-5 w-5" />;
    return <span className="text-lg">{REACTION_EMOJIS[currentReaction]}</span>;
  };

  const formatContent = (content: string) => {
    // Replace hashtags with styled spans
    return content.split(/(#\w+)/g).map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="text-blue-600 hover:underline cursor-pointer font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Card className={cn("border-none shadow-lg hover:shadow-xl transition-all duration-300", className)}>
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
              <UserAvatar
                src={post.authorPhotoURL}
                name={post.authorName}
                size="lg"
                verified={post.authorRole === "alumni" || post.authorRole === "mentor"}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                    {post.authorName}
                  </h3>
                  {post.authorRole && (
                    <Badge className={cn("text-xs", ROLE_BADGES[post.authorRole].color)}>
                      {ROLE_BADGES[post.authorRole].label}
                    </Badge>
                  )}
                </div>
                {(post.authorJobTitle || post.authorCompany) && (
                  <p className="text-sm text-gray-500">
                    {post.authorJobTitle}
                    {post.authorJobTitle && post.authorCompany && " at "}
                    {post.authorCompany}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                  {post.visibility === "college" && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      College
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Post Type Badge */}
              <div className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-xs font-medium bg-gradient-to-r",
                POST_TYPE_COLORS[post.postType]
              )}>
                <PostTypeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="capitalize hidden sm:inline">{post.postType}</span>
              </div>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save Post
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuItem className="cursor-pointer" onClick={onEditClick}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600" onClick={onDeleteClick}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem className="cursor-pointer text-red-600">
                      <Flag className="h-4 w-4 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
            {formatContent(post.content)}
          </p>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="relative">
            {post.images.length === 1 ? (
              <div className="relative w-full h-[250px] sm:h-[350px] md:h-[500px]">
                <Image
                  src={post.images[0]}
                  alt="Post image"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-[250px] sm:h-[350px] md:h-[500px]">
                  <Image
                    src={post.images[imageIndex]}
                    alt={`Post image ${imageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Image Navigation */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {post.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setImageIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === imageIndex
                          ? "bg-white w-4"
                          : "bg-white/50 hover:bg-white/75"
                      )}
                    />
                  ))}
                </div>
                {/* Navigation Arrows */}
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex((prev) => (prev === 0 ? post.images!.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setImageIndex((prev) => (prev === post.images!.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {likeCount > 0 && (
                <>
                  <span className="flex -space-x-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">
                      👍
                    </span>
                    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px]">
                      ❤️
                    </span>
                  </span>
                  <span className="ml-2 hover:underline cursor-pointer">
                    {likeCount} {likeCount === 1 ? "like" : "likes"}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {post.commentsCount > 0 && (
                <span className="hover:underline cursor-pointer" onClick={onCommentClick}>
                  {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
                </span>
              )}
              {post.sharesCount > 0 && (
                <span className="hover:underline cursor-pointer">
                  {post.sharesCount} {post.sharesCount === 1 ? "share" : "shares"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-2 sm:px-6 py-2 border-t border-gray-100">
          <div className="flex items-center justify-around">
            {/* Like Button with Reaction Picker */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowReactionPicker(true)}
                onMouseLeave={() => setShowReactionPicker(false)}
                onClick={() => handleLike(currentReaction || "like")}
                disabled={isLiking || !currentUserId}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm",
                  liked
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-gray-600 hover:bg-gray-100",
                  (!currentUserId || isLiking) && "opacity-50 cursor-not-allowed"
                )}
              >
                {getReactionIcon()}
                <span className="hidden sm:inline">{liked ? (currentReaction ? currentReaction.charAt(0).toUpperCase() + currentReaction.slice(1) : "Liked") : "Like"}</span>
              </button>

              {/* Reaction Picker */}
              {showReactionPicker && currentUserId && (
                <div
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mb-2 bg-white rounded-full shadow-2xl border border-gray-100 px-1 sm:px-2 py-1 flex items-center gap-0.5 sm:gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((reaction) => (
                    <button
                      key={reaction}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(reaction);
                      }}
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl sm:text-2xl transition-transform hover:scale-125",
                        currentReaction === reaction && "bg-blue-100"
                      )}
                      title={reaction.charAt(0).toUpperCase() + reaction.slice(1)}
                    >
                      {REACTION_EMOJIS[reaction]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Button */}
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all text-sm"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Comment</span>
            </button>

            {/* Share Button */}
            <button
              onClick={onShareClick}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all text-sm"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
