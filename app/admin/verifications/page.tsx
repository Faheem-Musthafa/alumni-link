"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/utils/error-handling";
import { getVerificationRequests, updateVerificationStatus } from "@/lib/firebase/verification";
import { logAdminActivity } from "@/lib/firebase/adminLogs";
import { downloadCSV, prepareVerificationExport } from "@/lib/utils/exportData";
import { auth } from "@/lib/firebase/config";
import { VerificationRequest } from "@/types";
import { 
  FileCheck, 
  Phone, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  GraduationCap,
  Users,
  Star,
  FileDown,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Mail
} from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";

// Admin authentication check
function useAdminAuth() {
  const router = useRouter();
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [router]);
}

export default function VerificationsPage() {
  useAdminAuth(); // Check admin authentication
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;
    
    const loadVerifications = async () => {
      try {
        setLoading(true);
        const data = await getVerificationRequests();
        if (mounted) {
          setVerifications(data);
        }
      } catch (error: any) {
        if (mounted) {
          handleError(error, "Failed to load verifications");
          toast({
            title: "Error",
            description: error.message || "Failed to load verifications",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVerifications();

    return () => {
      mounted = false;
    };
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await getVerificationRequests();
      setVerifications(data);
    } catch (error: any) {
      handleError(error, "Failed to load verifications");
      toast({
        title: "Error",
        description: error.message || "Failed to load verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (verification: VerificationRequest, action: "approve" | "reject") => {
    setSelectedVerification(verification);
    setReviewAction(action);
    setRejectionReason("");
  };

  const handleSubmitReview = async () => {
    if (!selectedVerification || !reviewAction) return;
    
    const adminUsername = sessionStorage.getItem("adminUsername") || "admin";

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateVerificationStatus(
        selectedVerification.id,
        reviewAction === "approve" ? "approved" : "rejected",
        adminUsername,
        reviewAction === "reject" ? rejectionReason : undefined
      );

      // Log admin activity
      if (auth && auth.currentUser) {
        await logAdminActivity({
          adminId: auth.currentUser.uid,
          adminEmail: auth.currentUser.email || "Unknown",
          adminName: auth.currentUser.displayName || "Admin",
          action: reviewAction === "approve" ? "approve_verification" : "reject_verification",
          targetType: "verification",
          targetId: selectedVerification.id,
          targetName: selectedVerification.userName,
          details: `Verification ${reviewAction === "approve" ? "approved" : "rejected"} for ${selectedVerification.userName}`,
          metadata: {
            userName: selectedVerification.userName,
            userEmail: selectedVerification.userEmail,
            userRole: selectedVerification.userRole,
            verificationType: selectedVerification.verificationType,
            ...(reviewAction === "reject" && { rejectionReason })
          }
        });
      }

      toast({
        title: "Success",
        description: `Verification ${reviewAction === "approve" ? "approved" : "rejected"} successfully`,
      });

      setSelectedVerification(null);
      setReviewAction(null);
      setRejectionReason("");
      loadVerifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search verifications
  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = searchQuery === "" || 
      verification.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || verification.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredVerifications.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedVerifications = filteredVerifications.slice(startIndex, startIndex + pageSize);

  // Export functionality
  const handleExport = () => {
    try {
      const exportData = prepareVerificationExport(filteredVerifications);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(
        exportData,
        [
          { key: 'id', label: 'ID' },
          { key: 'userName', label: 'User Name' },
          { key: 'userEmail', label: 'Email' },
          { key: 'userRole', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Submitted Date' },
          { key: 'documentType', label: 'Document Type' },
        ],
        `verifications-${timestamp}`
      );
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} verification records`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === "pending").length,
    approved: verifications.filter(v => v.status === "approved").length,
    rejected: verifications.filter(v => v.status === "rejected").length,
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "student": return { icon: GraduationCap, color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10", text: "text-emerald-400" };
      case "alumni": return { icon: Users, color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10", text: "text-purple-400" };
      case "aspirant": return { icon: Star, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-400" };
      default: return { icon: Users, color: "from-slate-500 to-slate-600", bg: "bg-slate-500/10", text: "text-slate-400" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: Clock };
      case "approved": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckCircle };
      case "rejected": return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: XCircle };
      default: return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: Clock };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Loading verifications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Verifications</h1>
            </div>
            <p className="text-slate-400">Review and approve user verification requests</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadVerifications}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, color: "from-slate-500 to-slate-600" },
            { label: "Pending", value: stats.pending, color: "from-amber-500 to-orange-500", urgent: stats.pending > 0 },
            { label: "Approved", value: stats.approved, color: "from-emerald-500 to-green-500" },
            { label: "Rejected", value: stats.rejected, color: "from-red-500 to-rose-500" },
          ].map((stat, index) => (
            <Card key={index} className={`p-4 bg-slate-800/30 border-slate-700/50 ${stat.urgent ? 'ring-2 ring-amber-500/30' : ''}`}>
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              {stat.urgent && <p className="text-xs text-amber-400 mt-1">Needs attention</p>}
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="p-4 bg-slate-800/30 border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-amber-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="h-10 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </Card>

        {/* Verifications List */}
        {filteredVerifications.length === 0 ? (
          <Card className="p-12 bg-slate-800/30 border-slate-700/50 text-center">
            <FileCheck className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No verification requests found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedVerifications.map((verification) => {
              const roleConfig = getRoleConfig(verification.userRole);
              const statusConfig = getStatusConfig(verification.status);
              const RoleIcon = roleConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              let additionalInfo: any = null;
              try {
                if (verification.additionalInfo) {
                  additionalInfo = JSON.parse(verification.additionalInfo);
                }
              } catch (e) {}
              
              return (
                <Card key={verification.id} className="p-6 bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <RoleIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{verification.userName}</h3>
                            <Badge className={`${roleConfig.bg} ${roleConfig.text} border-0 capitalize`}>
                              {verification.userRole}
                            </Badge>
                            <Badge className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {verification.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Mail className="w-4 h-4" />
                            {verification.userEmail}
                          </div>
                          
                          {/* Verification Details */}
                          <div className="flex flex-wrap gap-4 mt-3">
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              {verification.verificationType === "id_card" ? <FileCheck className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                              {verification.verificationType === "id_card" ? "ID Card" : "Phone OTP"}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <Calendar className="w-4 h-4" />
                              Submitted {new Date(verification.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* ID Card Preview Link */}
                          {verification.idCardUrl && (
                            <div className="mt-3">
                              <a
                                href={verification.idCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View ID Card
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          
                          {verification.phoneNumber && (
                            <div className="mt-2 flex items-center gap-1.5 text-slate-400 text-sm">
                              <Phone className="w-4 h-4" />
                              {verification.phoneNumber}
                            </div>
                          )}
                          
                          {/* Additional Info */}
                          {additionalInfo && (
                            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                              <h4 className="text-sm font-semibold text-white mb-3">Verification Details</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                {additionalInfo.collegeName && (
                                  <div>
                                    <span className="text-slate-500">College</span>
                                    <p className="text-slate-300">{additionalInfo.collegeName}</p>
                                  </div>
                                )}
                                {additionalInfo.department && (
                                  <div>
                                    <span className="text-slate-500">Department</span>
                                    <p className="text-slate-300">{additionalInfo.department}</p>
                                  </div>
                                )}
                                {additionalInfo.course && (
                                  <div>
                                    <span className="text-slate-500">Course</span>
                                    <p className="text-slate-300">{additionalInfo.course}</p>
                                  </div>
                                )}
                                {additionalInfo.enrollmentNumber && (
                                  <div>
                                    <span className="text-slate-500">Enrollment #</span>
                                    <p className="text-slate-300">{additionalInfo.enrollmentNumber}</p>
                                  </div>
                                )}
                                {additionalInfo.graduationYear && (
                                  <div>
                                    <span className="text-slate-500">Graduation Year</span>
                                    <p className="text-slate-300">{additionalInfo.graduationYear}</p>
                                  </div>
                                )}
                                {additionalInfo.phoneNumber && (
                                  <div>
                                    <span className="text-slate-500">Phone</span>
                                    <p className="text-slate-300">{additionalInfo.phoneNumber}</p>
                                  </div>
                                )}
                              </div>
                              {additionalInfo.notes && (
                                <div className="pt-3 mt-3 border-t border-slate-700/50">
                                  <span className="text-slate-500 text-sm">Additional Notes:</span>
                                  <p className="text-sm text-slate-300 mt-1">{additionalInfo.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Rejection Reason */}
                          {verification.status === "rejected" && verification.rejectionReason && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                              <p className="text-sm font-semibold text-red-400 mb-1">Rejection Reason:</p>
                              <p className="text-sm text-red-300">{verification.rejectionReason}</p>
                            </div>
                          )}
                          
                          {/* Review Info */}
                          {verification.reviewedBy && (
                            <p className="mt-3 text-xs text-slate-500">
                              Reviewed by {verification.reviewedBy} on {new Date(verification.reviewedAt || '').toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {verification.status === "pending" && (
                      <div className="flex lg:flex-col gap-2 lg:flex-shrink-0">
                        <Button
                          onClick={() => handleReview(verification, "approve")}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReview(verification, "reject")}
                          variant="outline"
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredVerifications.length > 0 && (
          <Card className="p-4 bg-slate-800/30 border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{startIndex + 1}</span> to <span className="font-medium text-white">{Math.min(startIndex + pageSize, filteredVerifications.length)}</span> of <span className="font-medium text-white">{filteredVerifications.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-slate-400 text-sm">{currentPage} / {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reviewAction === "approve" ? "bg-gradient-to-br from-emerald-500 to-green-500" : "bg-gradient-to-br from-red-500 to-rose-500"}`}>
                {reviewAction === "approve" ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
              </div>
              {reviewAction === "approve" ? "Approve" : "Reject"} Verification
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {reviewAction === "approve"
                ? "Are you sure you want to approve this verification request?"
                : "Please provide a reason for rejecting this verification request."}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-white">{selectedVerification.userName}</p>
                <p className="text-sm text-slate-400">{selectedVerification.userEmail}</p>
                <p className="text-sm text-slate-400 capitalize">Role: {selectedVerification.userRole}</p>
              </div>

              {reviewAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-slate-300">Reason for Rejection</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please explain why this verification is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-24 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVerification(null);
                setReviewAction(null);
                setRejectionReason("");
              }}
              disabled={submitting}
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || (reviewAction === "reject" && !rejectionReason.trim())}
              className={reviewAction === "approve" 
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90" 
                : "bg-red-500 hover:bg-red-600 text-white"}
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Submitting...</span>
                </div>
              ) : (
                <>
                  {reviewAction === "approve" ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                  {reviewAction === "approve" ? "Approve" : "Reject"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
