"use client";

import "./chat.css";
import { MainLayout } from "@/components/layout/main-layout";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { useEffect, useState, useRef } from "react";
import { Conversation, ChatMessage } from "@/types";
import { 
  getUserConversations, 
  subscribeToMessages, 
  sendMessage, 
  getMessages,
  togglePinConversation,
  toggleArchiveConversation,
  toggleMuteConversation,
  deleteMessage,
  blockUser,
  unblockUser,
  reportConversation,
  clearConversationHistory,
  markConversationMessagesDelivered,
  markConversationMessagesRead
} from "@/lib/firebase/chat";
import { setTypingStatus, subscribeToTyping, initializePresence } from "@/lib/firebase/chat-presence";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { OnlineStatus } from "@/components/chat/OnlineStatus";
import { MessageStatus } from "@/components/chat/MessageStatus";
import { FileUploader } from "@/components/chat/FileUploader";
import { MediaMessage } from "@/components/chat/MediaMessage";
import { LinkPreviewCard } from "@/components/chat/LinkPreviewCard";
import { ReactionPicker, ReactionList } from "@/components/chat/ReactionPicker";
import { ReplyPreview, QuotedMessage } from "@/components/chat/ReplyMessage";
import { MessageEdit, EditedIndicator } from "@/components/chat/MessageEdit";
import { StarButton, MultiSelectBar, MessageCheckbox, ForwardDialog, ForwardedIndicator } from "@/components/chat/MessageActions";
import { getUserData } from "@/lib/firebase/auth";
import { detectUrls, fetchLinkPreview, isSafeUrl, LinkPreview } from "@/lib/utils/link-preview";
import { getCachedLinkPreview, cacheLinkPreview } from "@/lib/firebase/link-preview";
import { toggleReaction } from "@/lib/firebase/reactions";
import { getReplyToMessage } from "@/lib/firebase/replies";
import { editMessage, canEditMessage, getRemainingEditTime } from "@/lib/firebase/message-edit";
import { toggleStarMessage, isMessageStarred, forwardMultipleMessages, canForwardMessage } from "@/lib/firebase/message-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Send, Search, MoreVertical, Phone, Video, Smile, Paperclip,
  Pin, Archive, Info, Star, Bell, Settings, CheckCheck, Check, X, Trash2, 
  AlertTriangle, BellOff, Shield, Flag, Ban, PinOff, ArchiveX, Reply, Pencil, Forward, CheckSquare
} from "lucide-react";
import { handleError } from "@/lib/utils/error-handling";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ChatPage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUserData, setOtherUserData] = useState<Record<string, any>>({});
  
  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Typing and presence states
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | undefined>();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // File upload states
  const [showFileUploader, setShowFileUploader] = useState(false);

  // Link preview states
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Reaction states
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null); // messageId

  // Reply states
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [replyToMessages, setReplyToMessages] = useState<Record<string, ChatMessage>>({});

  // Edit states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingRemainingTime, setEditingRemainingTime] = useState<number>(0);

  // Multi-select and forward states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showForwardDialog, setShowForwardDialog] = useState(false);

  // Load conversations
  useEffect(() => {
    if (user) {
      getUserConversations(user.uid)
        .then(async (convs) => {
          setConversations(convs);
          
          // Load user data for each conversation participant
          const userData: Record<string, any> = {};
          for (const conv of convs) {
            const otherUserId = conv.participants.find((p) => p !== user.uid);
            if (otherUserId && !userData[otherUserId]) {
              try {
                const data = await getUserData(otherUserId);
                userData[otherUserId] = data;
              } catch (error) {
                console.error("Failed to load user data:", error);
              }
            }
          }
          setOtherUserData(userData);
        })
        .catch((error) => {
          handleError(error, "Failed to load conversations");
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Subscribe to messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) {
      setMessages([]);
      setIsOtherUserTyping(false);
      return;
    }

    // Initial load of messages
    getMessages(selectedConversation.id)
      .then(setMessages)
      .catch((error) => handleError(error, "Failed to load messages"));

    // Subscribe to real-time updates
    const unsubscribeMessages = subscribeToMessages(selectedConversation.id, (newMessages) => {
      setMessages(newMessages);
      
      // Mark messages as delivered when opened
      if (user) {
        markConversationMessagesDelivered(selectedConversation.id, user.uid).catch(console.error);
      }
    });

    // Subscribe to typing indicator
    const unsubscribeTyping = subscribeToTyping(
      selectedConversation.id,
      user.uid,
      (isTyping, userId) => {
        setIsOtherUserTyping(isTyping);
        setTypingUserId(userId);
      }
    );

    // Mark messages as read when conversation is opened
    markConversationMessagesRead(selectedConversation.id, user.uid).catch(console.error);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [selectedConversation, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load replied-to messages
  useEffect(() => {
    const loadReplyToMessages = async () => {
      const replyToIds = messages
        .filter((msg) => msg.replyTo)
        .map((msg) => msg.replyTo!);

      const uniqueIds = [...new Set(replyToIds)];
      
      for (const replyToId of uniqueIds) {
        if (!replyToMessages[replyToId]) {
          try {
            const replyMsg = await getReplyToMessage(replyToId);
            if (replyMsg) {
              setReplyToMessages((prev) => ({
                ...prev,
                [replyToId]: replyMsg,
              }));
            }
          } catch (error) {
            console.error("Error loading reply message:", error);
          }
        }
      }
    };

    if (messages.length > 0) {
      loadReplyToMessages();
    }
  }, [messages]);

  // Initialize presence
  useEffect(() => {
    if (!user) return;
    
    const cleanup = initializePresence(user.uid);
    return cleanup;
  }, [user]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleMessageChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Handle typing indicator
    if (selectedConversation && user) {
      // Set typing status
      setTypingStatus(selectedConversation.id, user.uid, true).catch(console.error);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(selectedConversation.id, user.uid, false).catch(console.error);
      }, 3000);
    }

    // Detect URLs and fetch link preview
    const urls = detectUrls(newMessage);
    if (urls.length > 0 && isSafeUrl(urls[0])) {
      const firstUrl = urls[0];
      
      // Check if we already have a preview for this URL
      if (linkPreview?.url === firstUrl) return;
      
      setLoadingPreview(true);
      try {
        // Try to get cached preview first
        let preview = await getCachedLinkPreview(firstUrl);
        
        // If not cached, fetch new preview
        if (!preview) {
          preview = await fetchLinkPreview(firstUrl);
          if (preview) {
            // Cache the preview for future use
            await cacheLinkPreview(preview);
          }
        }
        
        setLinkPreview(preview);
      } catch (error) {
        console.error("Failed to fetch link preview:", error);
        setLinkPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    } else {
      // Clear link preview if no URLs
      setLinkPreview(null);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || !user) return;

    const otherUserId = selectedConversation.participants.find((p) => p !== user.uid);
    if (!otherUserId) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(selectedConversation.id, user.uid, false).catch(console.error);

    setSending(true);
    try {
      await sendMessage(
        selectedConversation.id,
        user.uid,
        otherUserId,
        message.trim(),
        "text",
        undefined,
        linkPreview || undefined,
        replyingTo?.id
      );
      setMessage("");
      setLinkPreview(null); // Clear link preview after sending
      setReplyingTo(null); // Clear reply after sending
    } catch (error) {
      handleError(error, "Failed to send message");
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const otherUserId = selectedConversation?.participants.find((p) => p !== user.uid);
      const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
      const userName = otherUserInfo?.displayName || user.displayName || user.email || "User";

      await toggleReaction(messageId, emoji, user.uid, userName);
      
      // Close reaction picker
      setShowReactionPicker(null);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReplyClick = (message: ChatMessage) => {
    setReplyingTo(message);
    setShowReactionPicker(null);
  };

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Highlight the message briefly
      element.classList.add("bg-blue-100");
      setTimeout(() => {
        element.classList.remove("bg-blue-100");
      }, 2000);
    }
  };

  const handleEditClick = (message: ChatMessage) => {
    if (!user) return;

    const { canEdit, reason } = canEditMessage(
      message.timestamp,
      message.senderId,
      user.uid
    );

    if (!canEdit) {
      toast({
        title: "Cannot edit message",
        description: reason,
        variant: "destructive",
      });
      return;
    }

    setEditingMessageId(message.id);
    setEditingRemainingTime(getRemainingEditTime(message.timestamp));
    setShowReactionPicker(null);

    // Update remaining time every second
    const interval = setInterval(() => {
      const remaining = getRemainingEditTime(message.timestamp);
      setEditingRemainingTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setEditingMessageId(null);
      }
    }, 1000);

    // Clean up interval when editing is cancelled or message changes
    return () => clearInterval(interval);
  };

  const handleSaveEdit = async (messageId: string, newContent: string) => {
    if (!user) return;

    try {
      await editMessage(messageId, newContent, user.uid);
      setEditingMessageId(null);
      
      toast({
        title: "Message updated",
        description: "Your message has been edited successfully",
      });
    } catch (error: any) {
      console.error("Error editing message:", error);
      throw error; // Re-throw to show in MessageEdit component
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  // ===== MESSAGE ACTIONS HANDLERS (Phase 3.4) =====

  const handleStarClick = async (messageId: string, currentStarred: boolean) => {
    if (!user) return;

    try {
      const result = await toggleStarMessage(messageId, user.uid, currentStarred);
      
      if (result.success) {
        toast({
          title: currentStarred ? "Message unstarred" : "Message starred",
          description: currentStarred 
            ? "Message removed from starred messages" 
            : "Message added to starred messages",
        });
      } else {
        toast({
          title: "Failed to star message",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starring message:", error);
      toast({
        title: "Error",
        description: "Failed to star message",
        variant: "destructive",
      });
    }
  };

  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedMessages(new Set());
  };

  const handleMessageSelect = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleCancelMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedMessages(new Set());
  };

  const handleForwardClick = () => {
    if (selectedMessages.size === 0) return;
    setShowForwardDialog(true);
  };

  const handleForwardMessages = async (targetUserId: string) => {
    if (!user || selectedMessages.size === 0) return;

    try {
      const messageIds = Array.from(selectedMessages);
      const result = await forwardMultipleMessages(messageIds, targetUserId, user.uid);

      if (result.successCount > 0) {
        toast({
          title: "Messages forwarded",
          description: `Successfully forwarded ${result.successCount} ${result.successCount === 1 ? 'message' : 'messages'}`,
        });
      }

      if (result.failedCount > 0) {
        toast({
          title: "Some messages failed",
          description: `${result.failedCount} ${result.failedCount === 1 ? 'message' : 'messages'} could not be forwarded`,
          variant: "destructive",
        });
      }

      // Reset selection
      setIsMultiSelectMode(false);
      setSelectedMessages(new Set());
      setShowForwardDialog(false);
    } catch (error) {
      console.error("Error forwarding messages:", error);
      toast({
        title: "Error",
        description: "Failed to forward messages",
        variant: "destructive",
      });
    }
  };

  const handleFileUploadComplete = async (data: {
    url: string;
    thumbnailUrl?: string;
    type: "image" | "document" | "video";
    filename: string;
    size: number;
  }) => {
    if (!selectedConversation || !user) return;

    const otherUserId = selectedConversation.participants.find((p) => p !== user.uid);
    if (!otherUserId) return;

    setSending(true);
    try {
      await sendMessage(
        selectedConversation.id,
        user.uid,
        otherUserId,
        data.filename,
        data.type,
        {
          mediaUrl: data.url,
          mediaType: data.type,
          mediaSize: data.size,
          thumbnailUrl: data.thumbnailUrl,
        }
      );
      
      setShowFileUploader(false);
      toast({
        title: "Sent successfully",
        description: `${data.filename} sent`,
      });
    } catch (error) {
      handleError(error, "Failed to send file");
      toast({
        title: "Error",
        description: "Failed to send file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handlePinConversation = async () => {
    if (!selectedConversation || !user) return;
    try {
      const isPinned = selectedConversation.pinnedBy?.includes(user.uid) || false;
      await togglePinConversation(selectedConversation.id, user.uid, !isPinned);
      toast({
        title: isPinned ? "Conversation unpinned" : "Conversation pinned",
        description: isPinned ? "Removed from pinned conversations" : "Added to pinned conversations",
      });
      // Reload conversations
      const convs = await getUserConversations(user.uid);
      setConversations(convs);
    } catch (error) {
      handleError(error, "Failed to update conversation");
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation || !user) return;
    try {
      const isArchived = selectedConversation.archivedBy?.includes(user.uid) || false;
      await toggleArchiveConversation(selectedConversation.id, user.uid, !isArchived);
      toast({
        title: isArchived ? "Conversation unarchived" : "Conversation archived",
        description: isArchived ? "Moved back to inbox" : "Moved to archived",
      });
      // Reload conversations
      const convs = await getUserConversations(user.uid);
      setConversations(convs);
      setSelectedConversation(null);
    } catch (error) {
      handleError(error, "Failed to archive conversation");
    }
  };

  const handleMuteConversation = async () => {
    if (!selectedConversation || !user) return;
    try {
      const isMuted = selectedConversation.mutedBy?.includes(user.uid) || false;
      await toggleMuteConversation(selectedConversation.id, user.uid, !isMuted);
      toast({
        title: isMuted ? "Notifications enabled" : "Notifications muted",
        description: isMuted ? "You will receive notifications again" : "You won't receive notifications",
      });
      // Reload conversations
      const convs = await getUserConversations(user.uid);
      setConversations(convs);
    } catch (error) {
      handleError(error, "Failed to mute conversation");
    }
  };

  const handleClearHistory = async () => {
    if (!selectedConversation || !user) return;
    try {
      await clearConversationHistory(selectedConversation.id, user.uid);
      toast({
        title: "Conversation cleared",
        description: "Messages have been cleared from your view",
      });
      setShowClearDialog(false);
      setMessages([]);
    } catch (error) {
      handleError(error, "Failed to clear conversation");
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation || !user) return;
    const otherUserId = selectedConversation.participants.find((p) => p !== user.uid);
    if (!otherUserId) return;

    try {
      await blockUser(user.uid, otherUserId);
      toast({
        title: "User blocked",
        description: "You will no longer receive messages from this user",
      });
      setShowBlockDialog(false);
      setSelectedConversation(null);
    } catch (error) {
      handleError(error, "Failed to block user");
    }
  };

  const handleReportConversation = async () => {
    if (!selectedConversation || !user || !reportReason) return;
    const otherUserId = selectedConversation.participants.find((p) => p !== user.uid);
    if (!otherUserId) return;

    setSubmittingReport(true);
    try {
      await reportConversation(
        selectedConversation.id,
        user.uid,
        otherUserId,
        reportReason,
        reportDescription
      );
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      handleError(error, "Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Google emoji categories
  const emojiCategories = {
    "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴"],
    "Gestures": ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
    "Celebrations": ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🎄", "🎃", "🎆", "🎇", "✨", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🧧", "🎗️", "🎟️", "🎫"],
    "Objects": ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳"],
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUserId = conv.participants.find((p) => p !== user?.uid);
    const userData = otherUserId ? otherUserData[otherUserId] : null;
    const searchLower = searchQuery.toLowerCase();
    
    return !searchQuery ||
      userData?.displayName?.toLowerCase().includes(searchLower) ||
      userData?.email?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchLower);
  });

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Loading conversations..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 top-0 left-72 bg-linear-to-br from-gray-50 to-blue-50/30 overflow-hidden">
        <div className="flex h-full w-full">
          {/* Sidebar - Conversations List */}
          <div className="w-[360px] bg-white shadow-sm flex flex-col border-r border-gray-200 shrink-0">
            {/* Sidebar Header */}
            <div className="px-5 py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl font-bold">Messages</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-blue-200 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 px-4 py-3 border-b bg-linear-to-b from-gray-50/50 to-transparent">
              <button className="px-4 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-blue-700 rounded-full shadow-sm hover:shadow-md transition-all">
                All
              </button>
              <button className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-all">
                <Pin className="h-3 w-3 inline mr-1.5" />
                Pinned
              </button>
              <button className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-all">
                <Star className="h-3 w-3 inline mr-1.5" />
                Starred
              </button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center py-20">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <MessageSquare className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">No conversations yet</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Connect with mentors, students, or alumni<br/>to start messaging
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find((p) => p !== user?.uid);
                    const isSelected = selectedConversation?.id === conversation.id;
                    const lastMessageTime = conversation.lastMessage?.timestamp 
                      ? new Date(conversation.lastMessage.timestamp)
                      : new Date();
                    
                    const isToday = lastMessageTime.toDateString() === new Date().toDateString();
                    const isYesterday = new Date(lastMessageTime).toDateString() === new Date(Date.now() - 86400000).toDateString();
                    const timeDisplay = isToday 
                      ? lastMessageTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : isYesterday 
                      ? "Yesterday"
                      : lastMessageTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const otherUserInfo = otherParticipant ? otherUserData[otherParticipant] : null;
                    const displayName = otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || `User ${otherParticipant?.slice(0, 8)}`;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation);
                        }}
                        className={`w-full px-4 py-3.5 text-left flex items-start gap-3 transition-all duration-200 border-l-3 group relative ${
                          isSelected
                            ? "bg-linear-to-r from-blue-50 to-blue-50/50 border-l-blue-600 shadow-sm"
                            : "hover:bg-gray-50/80 border-l-transparent"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""} rounded-full transition-all duration-200`}>
                            <UserAvatar
                              name={displayName}
                              src={otherUserInfo?.photoURL}
                              size="md"
                              className="h-12 w-12"
                            />
                          </div>
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-semibold text-sm truncate transition-colors ${
                              isSelected ? "text-blue-700" : "text-gray-900 group-hover:text-gray-900"
                            }`}>
                              {displayName}
                            </p>
                            <span className={`text-xs font-medium ml-2 shrink-0 ${
                              isSelected ? "text-blue-600" : "text-gray-500"
                            }`}>
                              {timeDisplay}
                            </span>
                          </div>
                          {conversation.lastMessage && (
                            <div className="flex items-center gap-2">
                              <p className={`text-xs flex-1 truncate ${
                                isSelected ? "text-gray-700" : "text-gray-600"
                              }`}>
                                {conversation.lastMessage.senderId === user?.uid && (
                                  <CheckCheck className="h-3 w-3 inline mr-1 text-blue-500" />
                                )}
                                {conversation.lastMessage.senderId === user?.uid ? "" : ""}
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const otherUserId = selectedConversation.participants.find((p) => p !== user?.uid);
                        const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
                        const displayName = otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || `User ${otherUserId?.slice(0, 8)}`;
                        
                        return (
                          <>
                            <div className="relative">
                              <div className="ring-2 ring-blue-100 rounded-full">
                                <UserAvatar
                                  name={displayName}
                                  src={otherUserInfo?.photoURL}
                                  size="md"
                                  className="h-12 w-12"
                                />
                              </div>
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-base">
                                {displayName}
                              </h3>
                              {otherUserId && (
                                <OnlineStatus userId={otherUserId} showLastSeen={true} />
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200">
                        <Video className="h-5 w-5" />
                      </button>
                      <button className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200">
                        <Phone className="h-5 w-5" />
                      </button>
                      <button className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200">
                        <Search className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={handleMultiSelectToggle}
                        className={`p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200 ${
                          isMultiSelectMode ? 'bg-blue-100 text-blue-600' : ''
                        }`}
                        title={isMultiSelectMode ? "Exit selection mode" : "Select messages"}
                      >
                        <CheckSquare className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setShowInfoDialog(true)}
                        className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                      
                      {/* More Options Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all duration-200">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={handlePinConversation}>
                            {selectedConversation?.pinnedBy?.includes(user?.uid || "") ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                Unpin conversation
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                Pin conversation
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleMuteConversation}>
                            {selectedConversation?.mutedBy?.includes(user?.uid || "") ? (
                              <>
                                <Bell className="h-4 w-4 mr-2" />
                                Unmute notifications
                              </>
                            ) : (
                              <>
                                <BellOff className="h-4 w-4 mr-2" />
                                Mute notifications
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleArchiveConversation}>
                            {selectedConversation?.archivedBy?.includes(user?.uid || "") ? (
                              <>
                                <ArchiveX className="h-4 w-4 mr-2" />
                                Unarchive
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear history
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setShowReportDialog(true)}
                            className="text-orange-600"
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            Report conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setShowBlockDialog(true)}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Block user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-6 py-6 bg-linear-to-b from-gray-50/30 to-blue-50/10">
                  <div className="space-y-1 max-w-5xl mx-auto">
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-white shadow-sm text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-gray-200">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                    </div>

                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center max-w-md">
                          <div className="bg-linear-to-br from-blue-100 to-blue-200 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <MessageSquare className="h-10 w-10 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Start the conversation</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            Send a message to break the ice and<br/>begin your mentorship journey
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isOwnMessage = msg.senderId === user?.uid;
                        const showTime = index === 0 || 
                          new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;
                        
                        const otherUserId = selectedConversation.participants.find((p) => p !== user?.uid);
                        const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
                        const displayName = otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || `User ${otherUserId?.slice(0, 8)}`;

                        const showAvatar = !isOwnMessage && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);

                        const isStarred = user && isMessageStarred(msg, user.uid);
                        const isSelected = selectedMessages.has(msg.id);
                        const canForward = canForwardMessage(msg);

                        return (
                          <div 
                            key={msg.id} 
                            id={`message-${msg.id}`}
                            className={`flex items-end gap-2 mb-1 transition-colors duration-500 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            {/* Multi-select checkbox */}
                            {isMultiSelectMode && canForward && (
                              <div className="mb-2">
                                <MessageCheckbox
                                  isSelected={isSelected}
                                  onToggle={() => handleMessageSelect(msg.id)}
                                  disabled={msg.deleted}
                                />
                              </div>
                            )}

                            {!isOwnMessage && (
                              <div className="h-8 w-8 mb-1 shrink-0">
                                {showAvatar && (
                                  <UserAvatar
                                    name={displayName}
                                    src={otherUserInfo?.photoURL}
                                    size="sm"
                                    className="h-8 w-8 shadow-sm ring-2 ring-white"
                                  />
                                )}
                              </div>
                            )}
                            
                            <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[65%]`}>
                              <div className="group relative">
                                {/* Forwarded Indicator */}
                                {msg.forwarded && (
                                  <ForwardedIndicator 
                                    forwardedFromName={
                                      msg.forwardedFrom === user?.uid 
                                        ? undefined 
                                        : otherUserData[msg.forwardedFrom || '']?.displayName
                                    }
                                  />
                                )}
                                
                                {/* Quoted/Replied Message */}
                                {msg.replyTo && replyToMessages[msg.replyTo] && (
                                  <QuotedMessage
                                    message={replyToMessages[msg.replyTo]}
                                    senderName={
                                      replyToMessages[msg.replyTo].senderId === user?.uid
                                        ? "You"
                                        : displayName
                                    }
                                    onClick={() => handleScrollToMessage(msg.replyTo!)}
                                    isOwnMessage={isOwnMessage}
                                  />
                                )}
                                
                                {/* Media messages (video removed for Firebase Free Tier) */}
                                {(msg.messageType === "image" || msg.messageType === "document") && msg.mediaUrl ? (
                                  <div className="space-y-2">
                                    <MediaMessage
                                      type={msg.messageType as "image" | "document"}
                                      url={msg.mediaUrl}
                                      thumbnailUrl={msg.thumbnailUrl}
                                      filename={msg.content}
                                      size={msg.mediaSize}
                                    />
                                    {msg.content && msg.messageType === "document" && (
                                      <p className="text-xs text-gray-500 px-2">{msg.content}</p>
                                    )}
                                  </div>
                                ) : editingMessageId === msg.id ? (
                                  /* Edit Mode */
                                  <div className="min-w-[300px]">
                                    <MessageEdit
                                      originalContent={msg.content}
                                      onSave={(newContent) => handleSaveEdit(msg.id, newContent)}
                                      onCancel={handleCancelEdit}
                                      remainingTime={editingRemainingTime}
                                    />
                                  </div>
                                ) : (
                                  /* Text message */
                                  <div className="space-y-2">
                                    <div
                                      className={`px-4 py-2.5 shadow-sm transition-all duration-200 ${
                                        isOwnMessage
                                          ? "bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-3xl rounded-br-md hover:shadow-md"
                                          : "bg-white text-gray-900 rounded-3xl rounded-bl-md border border-gray-200 hover:border-gray-300 hover:shadow-md"
                                      }`}
                                    >
                                      <p className="text-sm leading-relaxed wrap-break-word">{msg.content}</p>
                                      
                                      {/* Edited Indicator */}
                                      {msg.edited && msg.editedAt && (
                                        <div className="mt-1">
                                          <EditedIndicator 
                                            editedAt={msg.editedAt} 
                                            className={isOwnMessage ? "text-white/70" : ""}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Link Preview */}
                                    {msg.linkPreview && (
                                      <div className="max-w-sm">
                                        <LinkPreviewCard preview={msg.linkPreview} />
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Message actions on hover */}
                                {editingMessageId !== msg.id && !isMultiSelectMode && (
                                  <div className={`absolute top-0 ${isOwnMessage ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                    {/* Star button */}
                                    {user && (
                                      <StarButton
                                        isStarred={isStarred || false}
                                        onToggle={() => handleStarClick(msg.id, isStarred || false)}
                                        disabled={msg.deleted}
                                      />
                                    )}
                                    
                                    <button
                                      onClick={() => handleReplyClick(msg)}
                                      className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                      title="Reply to message"
                                    >
                                      <Reply className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                    
                                    {/* Edit button (only for own messages) */}
                                    {isOwnMessage && msg.messageType === "text" && !msg.deleted && (
                                      <button
                                        onClick={() => handleEditClick(msg)}
                                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                        title="Edit message"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                      </button>
                                    )}
                                    
                                    <div className="relative">
                                      <button
                                        onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                        title="Add reaction"
                                      >
                                        <Smile className="h-3.5 w-3.5 text-gray-500" />
                                      </button>
                                      
                                      {/* Reaction Picker */}
                                      {showReactionPicker === msg.id && (
                                        <ReactionPicker
                                          onSelect={(emoji) => handleReactionClick(msg.id, emoji)}
                                          onClose={() => setShowReactionPicker(null)}
                                          position="top"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Reactions List */}
                              {msg.reactions && Object.keys(msg.reactions).length > 0 && user && (
                                <ReactionList
                                  reactions={msg.reactions}
                                  currentUserId={user.uid}
                                  onReactionClick={(emoji) => handleReactionClick(msg.id, emoji)}
                                  className={isOwnMessage ? "justify-end" : "justify-start"}
                                />
                              )}
                              
                              {showTime && (
                                <div className={`flex items-center gap-1 mt-1 px-1 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                                  <p className="text-xs text-gray-500">
                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </p>
                                  {isOwnMessage && (
                                    <MessageStatus status={msg.status} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="bg-white border-t px-6 py-5 shadow-lg">
                  <div className="flex items-end gap-3 max-w-5xl mx-auto relative">
                    <div className="relative emoji-picker-container">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-full transition-all duration-200 mb-1"
                      >
                        <Smile className="h-5 w-5" />
                      </button>

                      {/* Emoji Picker Popup */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-[360px] max-h-[420px] overflow-y-auto z-50 emoji-picker-container">
                          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b">
                            <h3 className="text-sm font-semibold text-gray-700">Emojis</h3>
                            <button 
                              onClick={() => setShowEmojiPicker(false)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <X className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                          
                          {Object.entries(emojiCategories).map(([category, emojis]) => (
                            <div key={category} className="mb-4">
                              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{category}</h4>
                              <div className="grid grid-cols-8 gap-2">
                                {emojis.map((emoji, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl hover:bg-blue-50 rounded-lg p-2 transition-all hover:scale-110 active:scale-95"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setShowFileUploader(true)}
                      className="p-2.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-full transition-all duration-200 mb-1"
                      title="Attach file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      {/* Reply Preview Above Input */}
                      {replyingTo && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
                          <ReplyPreview
                            message={replyingTo}
                            senderName={
                              replyingTo.senderId === user?.uid
                                ? "You"
                                : otherUserData[replyingTo.senderId]?.displayName || "User"
                            }
                            onClose={() => setReplyingTo(null)}
                          />
                        </div>
                      )}
                      
                      {/* Link Preview Above Input */}
                      {linkPreview && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
                          <LinkPreviewCard
                            preview={linkPreview}
                            onClose={() => setLinkPreview(null)}
                            className="max-w-sm"
                          />
                        </div>
                      )}
                      
                      {/* Loading Preview Indicator */}
                      {loadingPreview && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 px-2">
                          <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-600">Fetching link preview...</span>
                          </div>
                        </div>
                      )}
                      
                      <textarea
                        placeholder="Type your message..."
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        className="w-full pl-5 pr-5 py-3.5 rounded-3xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none outline-none text-sm"
                        style={{ minHeight: "48px", maxHeight: "120px" }}
                      />
                    </div>

                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 mb-1 ${
                        !message.trim() || sending
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-linear-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105 active:scale-95"
                      }`}
                    >
                      {sending ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Typing indicator */}
                  <div className="max-w-5xl mx-auto mt-2 px-1">
                    {isOtherUserTyping && typingUserId ? (
                      <TypingIndicator 
                        userName={otherUserData[typingUserId]?.displayName || "User"} 
                      />
                    ) : (
                      <p className="text-xs text-gray-400">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-linear-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
                <div className="text-center max-w-md px-8">
                  <div className="relative mb-8">
                    <div className="bg-linear-to-br from-blue-500 to-blue-700 h-24 w-24 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <MessageSquare className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-linear-to-r from-green-400 to-green-500 h-8 w-8 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <span className="text-white text-xl font-bold">💬</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome to Messages
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Select a conversation from the sidebar to start chatting with students, alumni, and mentors in your network
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Real-time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Read receipts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Conversation Info
            </DialogTitle>
          </DialogHeader>
          {selectedConversation && (() => {
            const otherUserId = selectedConversation.participants.find((p) => p !== user?.uid);
            const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
            const displayName = otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || "Unknown User";
            
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <UserAvatar
                    name={displayName}
                    src={otherUserInfo?.photoURL}
                    size="lg"
                    className="h-16 w-16"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-600">{otherUserInfo?.email}</p>
                    {otherUserInfo?.role && (
                      <p className="text-xs text-blue-600 capitalize mt-1">{otherUserInfo.role}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages:</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">
                      {new Date(selectedConversation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Flag className="h-5 w-5" />
              Report Conversation
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate behavior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="report-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or scam</SelectItem>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-description">Additional details (optional)</Label>
              <Textarea
                id="report-description"
                placeholder="Provide more context about the issue..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reportDescription.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <ActionButton
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                disabled={submittingReport}
              >
                Cancel
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleReportConversation}
                loading={submittingReport}
                disabled={!reportReason}
                icon={<Flag className="h-4 w-4" />}
              >
                Submit Report
              </ActionButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Block User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block this user?
            </DialogDescription>
          </DialogHeader>
          {selectedConversation && (() => {
            const otherUserId = selectedConversation.participants.find((p) => p !== user?.uid);
            const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
            const displayName = otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || "Unknown User";
            
            return (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>{displayName}</strong> will no longer be able to:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>Send you messages</li>
                    <li>See your online status</li>
                    <li>View your profile updates</li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-end">
                  <ActionButton
                    variant="outline"
                    onClick={() => setShowBlockDialog(false)}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    variant="primary"
                    onClick={handleBlockUser}
                    icon={<Ban className="h-4 w-4" />}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Block User
                  </ActionButton>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Clear History Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-gray-600" />
              Clear Conversation History
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all messages in this conversation?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will only clear messages from your view. 
                The other person will still be able to see the conversation history.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <ActionButton
                variant="outline"
                onClick={() => setShowClearDialog(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleClearHistory}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Clear History
              </ActionButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Uploader */}
      {showFileUploader && selectedConversation && user && (
        <FileUploader
          conversationId={selectedConversation.id}
          userId={user.uid}
          onUploadComplete={handleFileUploadComplete}
          onCancel={() => setShowFileUploader(false)}
        />
      )}

      {/* Multi-Select Bar (Phase 3.4) */}
      {isMultiSelectMode && selectedMessages.size > 0 && (
        <MultiSelectBar
          selectedCount={selectedMessages.size}
          onCancel={handleCancelMultiSelect}
          onForward={handleForwardClick}
          canForward={Array.from(selectedMessages).every(id => {
            const msg = messages.find(m => m.id === id);
            return msg && canForwardMessage(msg);
          })}
        />
      )}

      {/* Forward Dialog (Phase 3.4) */}
      {showForwardDialog && (
        <ForwardDialog
          isOpen={showForwardDialog}
          onClose={() => setShowForwardDialog(false)}
          onForward={handleForwardMessages}
          selectedCount={selectedMessages.size}
          recentChats={conversations.map(conv => {
            const otherUserId = conv.participants.find(p => p !== user?.uid);
            const otherUserInfo = otherUserId ? otherUserData[otherUserId] : null;
            return {
              userId: otherUserId || '',
              name: otherUserInfo?.displayName || otherUserInfo?.email?.split('@')[0] || 'Unknown User',
              avatar: otherUserInfo?.photoURL,
              lastMessage: conv.lastMessage?.content,
            };
          }).filter(chat => chat.userId)}
        />
      )}
    </MainLayout>
  );
}

