"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ImageIcon, Smile, Hash, Globe, Users, Building, Sparkles, Trophy, Megaphone, FileText, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createPost, PostType } from "@/lib/firebase/posts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user: {
    id: string;
    name: string;
    photoURL?: string;
    role?: UserRole;
    jobTitle?: string;
    company?: string;
    college?: string;
  };
}

const POST_TYPES: { type: PostType; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { type: "achievement", label: "Achievement", icon: Trophy, color: "from-yellow-500 to-orange-500", description: "Share your accomplishments" },
  { type: "milestone", label: "Milestone", icon: Target, color: "from-green-500 to-emerald-500", description: "Celebrate your progress" },
  { type: "announcement", label: "Announcement", icon: Megaphone, color: "from-blue-500 to-cyan-500", description: "Make an announcement" },
  { type: "article", label: "Article", icon: FileText, color: "from-purple-500 to-pink-500", description: "Share insights or stories" },
  { type: "general", label: "General", icon: Sparkles, color: "from-gray-500 to-slate-500", description: "Just sharing thoughts" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Anyone", icon: Globe, description: "Visible to everyone" },
  { value: "college", label: "College Only", icon: Building, description: "Only your college network" },
  { value: "connections", label: "Connections", icon: Users, description: "Only your connections" },
];

export function CreatePostModal({ isOpen, onClose, onSuccess, user }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("achievement");
  const [visibility, setVisibility] = useState<"public" | "connections" | "college">("public");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostTypeSelector, setShowPostTypeSelector] = useState(false);
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Clean up image previews on unmount
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    // Limit to 4 images
    const remainingSlots = 4 - images.length;
    const newImages = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      toast({
        title: "Image limit reached",
        description: "You can only upload up to 4 images",
        variant: "destructive",
      });
    }

    // Create previews
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...newImages]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content or images to your post",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(
        {
          authorId: user.id,
          authorName: user.name,
          authorPhotoURL: user.photoURL,
          authorRole: user.role,
          authorJobTitle: user.jobTitle,
          authorCompany: user.company,
        },
        {
          content: content.trim(),
          postType,
          images: images.length > 0 ? images : undefined,
          visibility,
          college: visibility === "college" ? user.college : undefined,
        }
      );

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully",
      });

      // Reset form
      setContent("");
      setPostType("achievement");
      setVisibility("public");
      setImages([]);
      setImagePreviews([]);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedPostType = POST_TYPES.find((pt) => pt.type === postType)!;
  const selectedVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;
  const VisibilityIcon = selectedVisibility.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
      <Card className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 rounded-t-3xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-r text-white shadow-lg",
              selectedPostType.color
            )}>
              <selectedPostType.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Create Post</h2>
              <p className="text-xs text-gray-500 hidden sm:block">{selectedPostType.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
          {/* Author Info */}
          <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <UserAvatar
              src={user.photoURL}
              name={user.name}
              size="lg"
              verified={user.role === "alumni" || user.role === "mentor"}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                {/* Post Type Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowPostTypeSelector(!showPostTypeSelector);
                      setShowVisibilitySelector(false);
                    }}
                    className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-xs font-medium bg-gradient-to-r transition-all hover:opacity-90",
                      selectedPostType.color
                    )}
                  >
                    <selectedPostType.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">{selectedPostType.label}</span>
                  </button>
                  
                  {showPostTypeSelector && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border p-2 min-w-[200px] z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                      {POST_TYPES.map((pt) => (
                        <button
                          key={pt.type}
                          onClick={() => {
                            setPostType(pt.type);
                            setShowPostTypeSelector(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
                            postType === pt.type && "bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
                            pt.color
                          )}>
                            <pt.icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{pt.label}</p>
                            <p className="text-xs text-gray-500">{pt.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visibility Selector */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowVisibilitySelector(!showVisibilitySelector);
                      setShowPostTypeSelector(false);
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <VisibilityIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">{selectedVisibility.label}</span>
                  </button>

                  {showVisibilitySelector && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border p-2 min-w-[200px] z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                      {VISIBILITY_OPTIONS.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => {
                            setVisibility(v.value as "public" | "connections" | "college");
                            setShowVisibilitySelector(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
                            visibility === v.value && "bg-gray-50"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <v.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{v.label}</p>
                            <p className="text-xs text-gray-500">{v.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Input */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === "achievement"
                  ? "Share your achievement with the community... 🏆"
                  : postType === "milestone"
                  ? "Tell us about your milestone... 🎯"
                  : postType === "announcement"
                  ? "What would you like to announce?... 📢"
                  : "What's on your mind?..."
              }
              className="min-h-[120px] sm:min-h-[150px] text-base sm:text-lg border-none shadow-none resize-none focus:ring-0 focus-visible:ring-0 p-0"
              disabled={isSubmitting}
            />

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className={cn(
                "grid gap-2 mt-3 sm:mt-4",
                imagePreviews.length === 1 ? "grid-cols-1" :
                imagePreviews.length === 2 ? "grid-cols-2" :
                "grid-cols-2"
              )}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={cn(
                    "relative group rounded-xl overflow-hidden",
                    imagePreviews.length === 1 ? "h-[200px] sm:h-[300px]" : "h-32 sm:h-48"
                  )}>
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={isSubmitting || images.length >= 4}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || images.length >= 4}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all",
                  images.length >= 4
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
              >
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Photo</span>
                {images.length > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    {images.length}/4
                  </Badge>
                )}
              </button>
              <button
                disabled={isSubmitting}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 text-xs sm:text-sm font-medium transition-all"
              >
                <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Feeling</span>
              </button>
              <button
                disabled={isSubmitting}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 text-sm font-medium transition-all"
              >
                <Hash className="h-5 w-5" />
                <span>Hashtag</span>
              </button>
            </div>

            <ActionButton
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
              loading={isSubmitting}
              loadingText="Posting..."
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
            >
              <Sparkles className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Post</span>
            </ActionButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
