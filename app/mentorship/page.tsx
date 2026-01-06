"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentorCard, MentorCardGrid } from "@/components/ui/mentor-card";
import { ActionButton } from "@/components/ui/action-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { getUserData } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/profiles";
import { 
  getMentorshipRequestsByStudent, 
  getMentorshipRequestsByMentor, 
  getAvailableMentors,
  createMentorshipRequest,
  updateMentorshipRequest
} from "@/lib/firebase/mentorship";
import { getConversationBetweenUsers, createConversation, sendMessage } from "@/lib/firebase/chat";
import { handleError } from "@/lib/utils/error-handling";
import { formatDate } from "@/lib/utils/date";
import { useEffect, useState } from "react";
import { User, MentorshipRequest, UserProfile } from "@/types";
import { Users, CheckCircle, XCircle, MessageSquare, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MentorshipPage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const router = useRouter();
  const [userData, setUserData] = useState<User | null>(null);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<Record<string, UserProfile>>({});
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedMentors, setAppliedMentors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      getUserData(user.uid).then((data) => {
        setUserData(data);
        if (data) {
          if (data.role === "student" || data.role === "aspirant") {
            getMentorshipRequestsByStudent(user.uid).then((reqs) => {
              setRequests(reqs);
              // Track which mentors already have requests
              const mentorIds = new Set(reqs.map(r => r.mentorId));
              setAppliedMentors(mentorIds);
            }).finally(() => setLoading(false));
          } else if (data.role === "alumni") {
            getMentorshipRequestsByMentor(user.uid).then(setRequests).finally(() => setLoading(false));
          }
        }
      });
    }
  }, [user]);

  const loadMentors = async () => {
    setLoadingMentors(true);
    try {
      const availableMentors = await getAvailableMentors();
      setMentors(availableMentors);
      
      // Load profiles for all mentors
      const profiles: Record<string, UserProfile> = {};
      for (const mentor of availableMentors) {
        const profile = await getUserProfile(mentor.id);
        if (profile) {
          profiles[mentor.id] = profile;
        }
      }
      setMentorProfiles(profiles);
    } catch (error) {
      console.error("Error loading mentors:", error);
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleBrowseMentors = () => {
    setShowBrowse(true);
    if (mentors.length === 0) {
      loadMentors();
    }
  };

  const handleRequestMentorship = async () => {
    if (!user || !selectedMentor) return;

    setSubmitting(true);
    try {
      await createMentorshipRequest(
        user.uid,
        selectedMentor.id,
        requestMessage.trim() || undefined
      );

      setAppliedMentors(prev => new Set(prev).add(selectedMentor.id));
      alert("Mentorship request sent successfully!");
      setSelectedMentor(null);
      setRequestMessage("");
      
      // Reload requests
      const reqs = await getMentorshipRequestsByStudent(user.uid);
      setRequests(reqs);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, studentId: string) => {
    try {
      await updateMentorshipRequest(requestId, { status: "accepted" });
      
      // Create or get conversation between mentor and student
      try {
        let conversation = await getConversationBetweenUsers(user!.uid, studentId);
        
        if (!conversation) {
          // Create new conversation
          const conversationId = await createConversation([user!.uid, studentId]);
          
          // Send initial system message
          await sendMessage(
            conversationId,
            user!.uid,
            studentId,
            "Hi! I've accepted your mentorship request. Feel free to ask me anything!",
            "text"
          );
        }
      } catch (convError) {
        console.error("Error creating conversation:", convError);
        // Continue even if conversation creation fails
      }
      
      const reqs = await getMentorshipRequestsByMentor(user!.uid);
      setRequests(reqs);
      alert("Request accepted! You can now message the student.");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request.");
    }
  };

  const handleMessageMentor = async (mentorId: string) => {
    try {
      // Check if conversation exists
      let conversation = await getConversationBetweenUsers(user!.uid, mentorId);
      
      if (!conversation) {
        // Create new conversation
        const conversationId = await createConversation([user!.uid, mentorId]);
        
        // Send initial message
        await sendMessage(
          conversationId,
          user!.uid,
          mentorId,
          "Hi! Thanks for accepting my mentorship request. I'm looking forward to learning from you!",
          "text"
        );
      }
      
      // Navigate to chat page
      router.push("/chat");
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateMentorshipRequest(requestId, { status: "rejected" });
      const reqs = await getMentorshipRequestsByMentor(user!.uid);
      setRequests(reqs);
      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request.");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, any> = {
      pending: "pending",
      accepted: "approved",
      rejected: "rejected",
      completed: "success",
      cancelled: "inactive",
    };
    return (
      <StatusBadge variant={statusMap[status] || "pending"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </StatusBadge>
    );
  };

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Loading mentorship requests..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Mentorship"
          description={
            userData?.role === "student" || userData?.role === "aspirant"
              ? "Connect with experienced alumni for personalized guidance and career advice"
              : "Review and manage mentorship requests from aspiring students"
          }
          actions={
            (userData?.role === "student" || userData?.role === "aspirant") ? (
              <div className="flex gap-2">
                <ActionButton 
                  variant={showBrowse ? "outline" : "primary"}
                  onClick={() => setShowBrowse(false)}
                >
                  My Requests
                </ActionButton>
                <ActionButton 
                  variant={showBrowse ? "primary" : "outline"}
                  onClick={handleBrowseMentors}
                  icon={<Search />}
                >
                  Find Mentors
                </ActionButton>
              </div>
            ) : undefined
          }
        />

        {/* Browse Mentors View */}
        {showBrowse && (userData?.role === "student" || userData?.role === "aspirant") ? (
          <>
            {loadingMentors ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" message="Loading mentors..." />
              </div>
            ) : mentors.length === 0 ? (
              <Card className="border-none shadow-lg rounded-2xl">
                <CardContent className="py-16">
                  <EmptyState
                    icon={Users}
                    title="No mentors available yet"
                    description="Check back later for available alumni mentors"
                  />
                </CardContent>
              </Card>
            ) : (
              <MentorCardGrid>
                {mentors.map((mentor) => {
                  const profile = mentorProfiles[mentor.id];
                  const hasRequested = appliedMentors.has(mentor.id);
                  
                  return (
                    <MentorCard
                      key={mentor.id}
                      mentor={{
                        id: mentor.id,
                        name: mentor.displayName,
                        photoURL: mentor.photoURL,
                        role: "alumni",
                        verified: mentor.verificationStatus === "approved",
                        title: profile?.jobTitle,
                        company: profile?.currentCompany,
                        location: profile?.location,
                        education: profile?.college,
                        bio: profile?.bio,
                        skills: profile?.skills,
                        availability: "available"
                      }}
                      onConnect={hasRequested ? undefined : () => setSelectedMentor(mentor)}
                      isConnected={hasRequested}
                    />
                  );
                })}
              </MentorCardGrid>
            )}
          </>
        ) : requests.length === 0 ? (
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  {userData?.role === "student" || userData?.role === "aspirant"
                    ? "You haven't made any mentorship requests yet."
                    : "No mentorship requests at the moment."}
                </p>
                {(userData?.role === "student" || userData?.role === "aspirant") && (
                  <ActionButton 
                    variant="primary"
                    onClick={handleBrowseMentors}
                    icon={<Users />}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg px-6"
                  >
                    Browse Mentors
                  </ActionButton>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-none shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <UserAvatar
                          name={userData?.role === "student" || userData?.role === "aspirant" ? "Mentor" : "Student"}
                          size="lg"
                          fallbackClassName="bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            request.status === "accepted" ? "bg-green-500" :
                            request.status === "pending" ? "bg-yellow-500" :
                            "bg-gray-400"
                          }`} />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {userData?.role === "student" || userData?.role === "aspirant"
                            ? "Mentor Request"
                            : "Student Request"}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          Requested on {formatDate(request.requestedDate)}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                {request.message && (
                  <CardContent className="pt-0 pb-4">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 italic">"{request.message}"</p>
                    </div>
                  </CardContent>
                )}
                {request.status === "pending" && userData?.role === "alumni" && (
                  <CardContent className="flex gap-3 pt-0">
                    <ActionButton 
                      size="sm" 
                      variant="success"
                      onClick={() => handleAcceptRequest(request.id, request.studentId)}
                      icon={<CheckCircle className="h-4 w-4" />}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full shadow-md"
                    >
                      Accept
                    </ActionButton>
                    <ActionButton 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      icon={<XCircle />}
                      className="rounded-full border-2"
                    >
                      Decline
                    </ActionButton>
                  </CardContent>
                )}
                {request.status === "accepted" && (
                  <CardContent className="flex gap-3 pt-0">
                    <ActionButton 
                      size="sm" 
                      variant="primary"
                      onClick={() => handleMessageMentor(
                        userData?.role === "student" || userData?.role === "aspirant" 
                          ? request.mentorId 
                          : request.studentId
                      )}
                      icon={<MessageSquare className="h-4 w-4" />}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-md"
                    >
                      Message
                    </ActionButton>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Request Mentorship Dialog */}
        <Dialog open={selectedMentor !== null} onOpenChange={(open) => !open && setSelectedMentor(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Request Mentorship
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Send a mentorship request to {selectedMentor?.displayName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              {selectedMentor && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <UserAvatar
                    src={selectedMentor.photoURL}
                    name={selectedMentor.displayName}
                    size="lg"
                    verified={selectedMentor.verificationStatus === "approved"}
                    fallbackClassName="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{selectedMentor.displayName}</p>
                    <p className="text-sm text-gray-600">
                      {mentorProfiles[selectedMentor.id]?.jobTitle || "Alumni"}
                    </p>
                    {mentorProfiles[selectedMentor.id]?.currentCompany && (
                      <p className="text-xs text-gray-500">
                        at {mentorProfiles[selectedMentor.id]?.currentCompany}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Introduce yourself and explain why you'd like this mentor's guidance..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="rounded-xl border-2 border-gray-200 focus:border-purple-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {requestMessage.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <ActionButton 
                  variant="outline" 
                  onClick={() => setSelectedMentor(null)}
                  disabled={submitting}
                  className="rounded-full border-2"
                >
                  Cancel
                </ActionButton>
                <ActionButton 
                  variant="primary"
                  onClick={handleRequestMentorship}
                  loading={submitting}
                  loadingText="Sending..."
                  icon={<MessageSquare />}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg"
                >
                  Send Request
                </ActionButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

