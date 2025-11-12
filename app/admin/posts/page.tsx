"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/utils/error-handling";
import { JobPosting } from "@/types";
import { 
  Briefcase, 
  ArrowLeft, 
  Search,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  Filter,
  Download,
  FileDown
} from "lucide-react";
import { logAdminActivity } from "@/lib/firebase/adminLogs";
import { downloadCSV, prepareJobsExport } from "@/lib/utils/exportData";

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

export default function AdminPostsPage() {
  useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Pagination helpers
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    // Filter jobs based on search query
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = jobs.filter(job => 
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
      );
      setFilteredJobs(filtered);
    }
  }, [searchQuery, jobs]);

  const loadJobs = async () => {
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      const q = query(collection(db, "jobPostings"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const jobsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          deadline: data.deadline?.toDate(),
        } as unknown as JobPosting;
      });

      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load job posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job: JobPosting) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (job: JobPosting) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;

    setSubmitting(true);
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db, auth } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      await deleteDoc(doc(db, "jobPostings", selectedJob.id));

      // Log admin activity
      if (auth && auth.currentUser) {
        await logAdminActivity({
          adminId: auth.currentUser.uid,
          adminEmail: auth.currentUser.email || "Unknown",
          adminName: auth.currentUser.displayName || "Admin",
          action: "delete_job_post",
          targetType: "job",
          targetId: selectedJob.id,
          targetName: selectedJob.title,
          details: `Deleted job post: ${selectedJob.title} at ${selectedJob.company}`,
          metadata: {
            jobTitle: selectedJob.title,
            company: selectedJob.company,
            location: selectedJob.location,
            type: selectedJob.type,
          },
        });
      }

      toast({
        title: "Success",
        description: "Job post deleted successfully",
      });

      setDeleteDialogOpen(false);
      loadJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job post",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
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

  // Export handler
  const handleExport = () => {
    try {
      const exportData = prepareJobsExport(filteredJobs);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(
        exportData,
        [
          { key: 'id', label: 'ID' },
          { key: 'title', label: 'Title' },
          { key: 'company', label: 'Company' },
          { key: 'location', label: 'Location' },
          { key: 'type', label: 'Type' },
          { key: 'applicationsCount', label: 'Applications' },
          { key: 'createdAt', label: 'Posted Date' },
        ],
        `job-posts-${timestamp}`
      );
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} job postings`,
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "full-time": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "part-time": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "internship": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "contract": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-[#1a1f2e] rounded-xl flex items-center justify-center border border-gray-800">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Job Posts Management</h1>
              <p className="text-gray-400 text-sm">{jobs.length} total job postings</p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f2e] border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <Button variant="outline" className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e]">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="border-gray-800 text-gray-400 hover:bg-[#1a1f2e]"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Total Jobs</div>
            <div className="text-2xl font-bold text-white">{jobs.length}</div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Full-Time</div>
            <div className="text-2xl font-bold text-green-400">
              {jobs.filter(j => j.type === "full-time").length}
            </div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Internships</div>
            <div className="text-2xl font-bold text-purple-400">
              {jobs.filter(j => j.type === "internship").length}
            </div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">With Referrals</div>
            <div className="text-2xl font-bold text-blue-400">
              {jobs.filter(j => j.isReferral).length}
            </div>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card className="bg-[#1a1f2e] border-gray-800">
          <div className="overflow-x-auto">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No job postings found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Job Details</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Location</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Applications</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Posted</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-800 hover:bg-[#0f1419] transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-white mb-1">{job.title}</div>
                          <div className="text-sm text-gray-400">{job.company}</div>
                          {job.salary && typeof job.salary === 'object' && 'min' in job.salary && (
                            <div className="text-xs text-gray-500 mt-1">
                              {job.salary.currency} {job.salary.min} - {job.salary.max}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge className={getTypeBadgeColor(job.type)}>
                            {job.type}
                          </Badge>
                          {job.isReferral && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Referral
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-300">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {job.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">
                          {job.applicationsCount || 0}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Calendar className="h-4 w-4" />
                          {job.createdAt?.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJob(job)}
                            className="border-gray-700 text-gray-300 hover:bg-[#0f1419]"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteClick(job)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {filteredJobs.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                {/* Results Info */}
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} job posts
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-[#1a1f2e] border border-gray-800 rounded px-3 py-1 text-sm text-white"
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
          </div>
        </Card>
      </div>

      {/* View Job Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1f2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedJob?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedJob?.company}</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Type</div>
                  <Badge className={getTypeBadgeColor(selectedJob.type)}>
                    {selectedJob.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Location</div>
                  <div className="font-medium text-white">{selectedJob.location}</div>
                </div>
                {selectedJob.salary && typeof selectedJob.salary === 'object' && 'min' in selectedJob.salary && (
                  <div>
                    <div className="text-sm text-gray-400">Salary</div>
                    <div className="font-medium text-white">
                      {selectedJob.salary.currency} {selectedJob.salary.min} - {selectedJob.salary.max}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Description</div>
                <div className="text-gray-300 whitespace-pre-wrap">{selectedJob.description}</div>
              </div>

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Requirements</div>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="text-gray-300">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedJob as any).skills && (selectedJob as any).skills.length > 0 && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedJob as any).skills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-gray-700 text-gray-300 border-gray-600">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="border-gray-700 text-gray-300 hover:bg-[#0f1419]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Job Post
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedJob?.title}" at {selectedJob?.company}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
              className="border-gray-700 text-gray-300 hover:bg-[#0f1419]"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteJob}
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Deleting...</span>
                </div>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
