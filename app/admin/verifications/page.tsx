"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { useAuth } from "@/hooks/use-auth";
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
  Shield, 
  ArrowLeft, 
  FileCheck, 
  Phone, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  GraduationCap,
  Users,
  Sparkles,
  FileDown,
  Search,
  Filter
} from "lucide-react";

import { AdminLayout } from "@/components/layout/admin-layout";

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
  const endIndex = startIndex + pageSize;
  const paginatedVerifications = filteredVerifications.slice(startIndex, endIndex);

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

  // Pagination helpers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  const pendingVerifications = filteredVerifications.filter(v => v.status === "pending");
  const approvedVerifications = filteredVerifications.filter(v => v.status === "approved");
  const rejectedVerifications = filteredVerifications.filter(v => v.status === "rejected");

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      case "alumni":
        return <Users className="h-4 w-4" />;
      case "aspirant":
        return <Sparkles className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="icon" className="bg-[#1a1f2e] border-gray-800 text-white hover:bg-gray-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Verification Requests</h1>
              <p className="text-gray-400 text-sm">Review and approve user verifications</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <p className="text-sm font-medium text-gray-400">Pending</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">{pendingVerifications.length}</p>
          </Card>
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <p className="text-sm font-medium text-gray-400">Approved</p>
            <p className="text-3xl font-bold text-green-500 mt-2">{approvedVerifications.length}</p>
          </Card>
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <p className="text-sm font-medium text-gray-400">Rejected</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{rejectedVerifications.length}</p>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="p-6 mb-6 bg-[#1a1f2e] border-gray-800">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0f1419] border-gray-800 text-white placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
                className="bg-[#0f1419] border border-gray-800 rounded px-3 py-2 text-sm text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button 
                onClick={handleExport}
                variant="outline" 
                className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e]"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Verification List */}
        <Card className="p-6 bg-[#1a1f2e] border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">
            Verification Requests 
            {filteredVerifications.length > 0 && (
              <span className="text-sm text-gray-400 font-normal ml-2">
                ({filteredVerifications.length} total)
              </span>
            )}
          </h2>
          
          {filteredVerifications.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No verification requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedVerifications.map((verification) => (
                <Card key={verification.id} className="p-6 bg-[#0f1419] border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                          {getRoleIcon(verification.userRole)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{verification.userName}</h3>
                          <p className="text-sm text-gray-400">{verification.userEmail}</p>
                        </div>
                        <Badge variant="outline" className="capitalize border-gray-700 text-gray-300">
                          {verification.userRole}
                        </Badge>
                        {getStatusBadge(verification.status)}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          {verification.verificationType === "id_card" ? (
                            <FileCheck className="h-4 w-4" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                          <span className="capitalize">
                            {verification.verificationType === "id_card" ? "ID Card" : "Phone OTP"}
                          </span>
                        </div>
                        <div>
                          Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {verification.idCardUrl && (
                        <div>
                          <a
                            href={verification.idCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            View ID Card <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}

                      {verification.phoneNumber && (
                        <div className="text-sm text-gray-400">
                          Phone: {verification.phoneNumber}
                        </div>
                      )}

                      {verification.additionalInfo && (() => {
                        try {
                          const info = JSON.parse(verification.additionalInfo);
                          return (
                            <div className="p-4 bg-[#1a1f2e] rounded-lg border border-gray-800 space-y-2">
                              <h4 className="text-sm font-semibold text-white">Verification Details:</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {info.collegeName && (
                                  <div>
                                    <span className="text-gray-400">College:</span>
                                    <p className="font-medium text-gray-200">{info.collegeName}</p>
                                  </div>
                                )}
                                {info.department && (
                                  <div>
                                    <span className="text-gray-400">Department:</span>
                                    <p className="font-medium text-gray-200">{info.department}</p>
                                  </div>
                                )}
                                {info.course && (
                                  <div>
                                    <span className="text-gray-400">Course:</span>
                                    <p className="font-medium text-gray-200">{info.course}</p>
                                  </div>
                                )}
                                {info.enrollmentNumber && (
                                  <div>
                                    <span className="text-gray-400">Enrollment #:</span>
                                    <p className="font-medium text-gray-200">{info.enrollmentNumber}</p>
                                  </div>
                                )}
                                {info.graduationYear && (
                                  <div>
                                    <span className="text-gray-400">Graduation Year:</span>
                                    <p className="font-medium text-gray-200">{info.graduationYear}</p>
                                  </div>
                                )}
                                {info.phoneNumber && (
                                  <div>
                                    <span className="text-gray-400">Phone:</span>
                                    <p className="font-medium text-gray-200">{info.phoneNumber}</p>
                                  </div>
                                )}
                              </div>
                              {info.notes && (
                                <div className="pt-2 border-t border-gray-800">
                                  <span className="text-gray-400 text-sm">Additional Notes:</span>
                                  <p className="text-sm text-gray-200 mt-1">{info.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        } catch (e) {
                          return (
                            <div className="text-sm text-gray-400">
                              Additional Info: {verification.additionalInfo}
                            </div>
                          );
                        }
                      })()}

                      {verification.status === "rejected" && verification.rejectionReason && (
                        <div className="p-3 bg-red-950/30 border border-red-900 rounded-lg text-sm text-red-400">
                          <p className="font-semibold mb-1">Rejection Reason:</p>
                          <p>{verification.rejectionReason}</p>
                        </div>
                      )}

                      {verification.reviewedBy && verification.reviewedAt && (
                        <div className="text-xs text-gray-500">
                          Reviewed by {verification.reviewedBy} on{" "}
                          {new Date(verification.reviewedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {verification.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReview(verification, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReview(verification, "reject")}
                          variant="destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredVerifications.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              {/* Results Info */}
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredVerifications.length)} of {filteredVerifications.length} verifications
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-[#0f1419] border border-gray-800 rounded px-3 py-1 text-sm text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e] disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) => (
                    <React.Fragment key={idx}>
                      {pageNum === '...' ? (
                        <span className="px-2 text-gray-500">...</span>
                      ) : (
                        <Button
                          onClick={() => handlePageChange(pageNum as number)}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={currentPage === pageNum 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "border-gray-800 text-gray-400 hover:bg-[#1a1f2e]"
                          }
                        >
                          {pageNum}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e] disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="bg-[#1a1f2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewAction === "approve" ? "Approve" : "Reject"} Verification
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {reviewAction === "approve"
                ? "Are you sure you want to approve this verification request?"
                : "Please provide a reason for rejecting this verification request."}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-semibold text-white">{selectedVerification.userName}</p>
                <p className="text-sm text-gray-400">{selectedVerification.userEmail}</p>
                <p className="text-sm text-gray-400 capitalize">Role: {selectedVerification.userRole}</p>
              </div>

              {reviewAction === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-gray-300">Reason for Rejection</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please explain why this verification is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-24 bg-[#0f1419] border-gray-800 text-white placeholder-gray-500"
                    required
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVerification(null);
                setReviewAction(null);
                setRejectionReason("");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || (reviewAction === "reject" && !rejectionReason.trim())}
              className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={reviewAction === "reject" ? "destructive" : "default"}
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Submitting...</span>
                </div>
              ) : (
                <>
                  {reviewAction === "approve" ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
