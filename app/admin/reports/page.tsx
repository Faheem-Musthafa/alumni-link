"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/utils/error-handling";
import { getUserReports, updateReportStatus } from "@/lib/firebase/reports";
import { UserReport } from "@/types";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  Shield,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquareWarning,
  Flag,
  Calendar,
  User
} from "lucide-react";
import { logAdminActivity } from "@/lib/firebase/adminLogs";
import { downloadCSV, prepareReportsExport } from "@/lib/utils/exportData";

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

export default function ReportsPage() {
  useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<UserReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [reviewAction, setReviewAction] = useState<"resolved" | "dismissed" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    // Filter reports based on search
    if (searchQuery.trim() === "") {
      setFilteredReports(reports);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = reports.filter(report => 
        report.reportedUserName?.toLowerCase().includes(query) ||
        report.reporterName?.toLowerCase().includes(query) ||
        report.reason?.toLowerCase().includes(query)
      );
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports]);

  const loadReports = async () => {
    try {
      const data = await getUserReports();
      setReports(data);
      setFilteredReports(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (report: UserReport, action: "resolved" | "dismissed") => {
    setSelectedReport(report);
    setReviewAction(action);
    setActionNote("");
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !reviewAction) return;

    if (!actionNote.trim()) {
      toast({
        title: "Error",
        description: "Please provide action notes",
        variant: "destructive",
      });
      return;
    }

    const adminUsername = sessionStorage.getItem("adminUsername") || "admin";

    setSubmitting(true);
    try {
      // Pass the collection name to update the correct document
      await updateReportStatus(
        selectedReport.id,
        reviewAction,
        adminUsername,
        actionNote,
        selectedReport.collection || "userReports"
      );

      // Log admin activity
      try {
        const { auth } = await import("@/lib/firebase/config");
        if (auth && auth.currentUser) {
          await logAdminActivity({
            adminId: auth.currentUser.uid,
            adminEmail: auth.currentUser.email || adminUsername,
            adminName: auth.currentUser.displayName || adminUsername,
            action: reviewAction === "resolved" ? "resolve_report" : "dismiss_report",
            targetType: "report",
            targetId: selectedReport.id,
            targetName: `Report by ${selectedReport.reporterName} against ${selectedReport.reportedUserName}`,
            details: `${reviewAction === "resolved" ? "Resolved" : "Dismissed"} report: ${selectedReport.reason}`,
            metadata: {
              reportId: selectedReport.id,
              reportReason: selectedReport.reason,
              actionNote: actionNote,
              reportedUserId: selectedReport.reportedUserId,
              reporterId: selectedReport.reportedBy,
            },
          });
        }
      } catch (logError) {
        handleError(logError, "Failed to log activity");
      }

      toast({
        title: "Success",
        description: `Report ${reviewAction} successfully`,
      });

      setSelectedReport(null);
      setReviewAction(null);
      setActionNote("");
      loadReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "dismissed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredReports.length);
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Export handler
  const handleExport = () => {
    try {
      const exportData = prepareReportsExport(filteredReports);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(
        exportData,
        [
          { key: 'id', label: 'ID' },
          { key: 'reportedUserName', label: 'Reported User' },
          { key: 'reportedByName', label: 'Reported By' },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Report Date' },
        ],
        `reports-${timestamp}`
      );
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} reports`,
      });
    } catch (error) {
      handleError(error, "Export failed");
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Loading reports...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", icon: Clock };
      case "resolved": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckCircle };
      case "dismissed": return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: XCircle };
      default: return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: Clock };
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">User Reports</h1>
            </div>
            <p className="text-slate-400">Manage and review user reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadReports}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: stats.total, color: "from-slate-500 to-slate-600" },
            { label: "Pending", value: stats.pending, color: "from-amber-500 to-orange-500", urgent: stats.pending > 0 },
            { label: "Resolved", value: stats.resolved, color: "from-emerald-500 to-green-500" },
            { label: "Dismissed", value: stats.dismissed, color: "from-slate-500 to-slate-600" },
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
                placeholder="Search by user name or reason..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-red-500/50"
              />
            </div>
          </div>
        </Card>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card className="p-12 bg-slate-800/30 border-slate-700/50 text-center">
            <AlertTriangle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No reports found</p>
            <p className="text-slate-500 text-sm">No user reports have been submitted yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedReports.map((report, index) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={report.id} className="p-6 bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Report Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-lg">
                            {report.reportedUserName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{report.reportedUserName}</h3>
                            <Badge className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {report.status}
                            </Badge>
                            {report.type === "chat" && (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                <MessageSquareWarning className="w-3 h-3 mr-1" />
                                From Chat
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
                            <User className="w-4 h-4" />
                            Reported by: {report.reporterName}
                          </div>
                          
                          {/* Report Reason */}
                          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 mb-3">
                            <h4 className="text-sm font-semibold text-white mb-2">{report.reason}</h4>
                            <p className="text-sm text-slate-400">{report.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            {formatDate(report.createdAt)}
                          </div>
                          
                          {/* Review Info */}
                          {report.status !== "pending" && report.reviewedBy && (
                            <div className="mt-3 p-3 bg-slate-900/30 rounded-lg">
                              <p className="text-xs text-slate-500">
                                Reviewed by <span className="text-slate-400">{report.reviewedBy}</span>
                              </p>
                              {report.action && (
                                <p className="text-sm text-slate-400 mt-1">{report.action}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {report.status === "pending" && (
                      <div className="flex lg:flex-col gap-2 lg:flex-shrink-0">
                        <Button
                          onClick={() => handleReview(report, "resolved")}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Resolve
                        </Button>
                        <Button
                          onClick={() => handleReview(report, "dismissed")}
                          variant="outline"
                          className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Dismiss
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
        {filteredReports.length > 0 && (
          <Card className="p-4 bg-slate-800/30 border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{startRecord}</span> to <span className="font-medium text-white">{endRecord}</span> of <span className="font-medium text-white">{filteredReports.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-slate-400 text-sm">{currentPage} / {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
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
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reviewAction === "resolved" ? "bg-gradient-to-br from-emerald-500 to-green-500" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}>
                {reviewAction === "resolved" ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
              </div>
              {reviewAction === "resolved" ? "Resolve" : "Dismiss"} Report
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {reviewAction === "resolved"
                ? "Mark this report as resolved and provide action taken"
                : "Dismiss this report and provide a reason"}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reported User:</span>
                  <span className="text-white font-medium">{selectedReport.reportedUserName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reported By:</span>
                  <span className="text-white">{selectedReport.reporterName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reason:</span>
                  <span className="text-white">{selectedReport.reason}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Description:</p>
                <p className="text-white text-sm bg-slate-800/30 rounded-lg p-3">
                  {selectedReport.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Action Notes *</Label>
                <Textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Provide details about the action taken..."
                  rows={4}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null);
                setReviewAction(null);
              }}
              disabled={submitting}
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={reviewAction === "resolved" 
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90" 
                : "bg-slate-600 hover:bg-slate-700 text-white"}
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Submitting...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {reviewAction === "resolved" ? "Resolve Report" : "Dismiss Report"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
