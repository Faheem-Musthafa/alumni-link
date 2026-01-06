"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Building2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  TrendingUp
} from "lucide-react";
import { logAdminActivity } from "@/lib/firebase/adminLogs";
import { downloadCSV, prepareJobsExport } from "@/lib/utils/exportData";

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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredJobs.length);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
      );
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(job => job.type === typeFilter);
    }
    
    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [searchQuery, typeFilter, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      const q = query(collection(db, "jobPostings"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const jobsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let createdAt = new Date();
        let updatedAt = new Date();
        let deadline = undefined;
        
        if (data.createdAt) {
          createdAt = typeof data.createdAt.toDate === 'function' 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt);
        }
        
        if (data.updatedAt) {
          updatedAt = typeof data.updatedAt.toDate === 'function' 
            ? data.updatedAt.toDate() 
            : new Date(data.updatedAt);
        }
        
        if (data.deadline) {
          deadline = typeof data.deadline.toDate === 'function' 
            ? data.deadline.toDate() 
            : new Date(data.deadline);
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          deadline,
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "full-time": return { color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" };
      case "part-time": return { color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" };
      case "internship": return { color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" };
      case "contract": return { color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
      default: return { color: "from-slate-500 to-slate-600", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };
    }
  };

  // Stats
  const stats = {
    total: jobs.length,
    fullTime: jobs.filter(j => j.type === "full-time").length,
    partTime: jobs.filter(j => j.type === "part-time").length,
    internship: jobs.filter(j => j.type === "internship").length,
    contract: jobs.filter(j => j.type === "contract").length,
    referrals: jobs.filter(j => j.isReferral).length,
    totalApplications: jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0),
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Loading job posts...</p>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Job Posts</h1>
            </div>
            <p className="text-slate-400">{jobs.length} job postings on the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadJobs}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:opacity-90"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total", value: stats.total, color: "from-slate-500 to-slate-600" },
            { label: "Full-Time", value: stats.fullTime, color: "from-emerald-500 to-green-500" },
            { label: "Part-Time", value: stats.partTime, color: "from-blue-500 to-cyan-500" },
            { label: "Internship", value: stats.internship, color: "from-purple-500 to-violet-500" },
            { label: "Contract", value: stats.contract, color: "from-amber-500 to-orange-500" },
            { label: "Referrals", value: stats.referrals, color: "from-pink-500 to-rose-500" },
            { label: "Applications", value: stats.totalApplications, color: "from-indigo-500 to-purple-500" },
          ].map((stat, index) => (
            <Card key={index} className="p-4 bg-slate-800/30 border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="p-4 bg-slate-800/30 border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </Card>

        {/* Jobs Grid/List */}
        {filteredJobs.length === 0 ? (
          <Card className="p-12 bg-slate-800/30 border-slate-700/50 text-center">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No job postings found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedJobs.map((job) => {
              const typeConfig = getTypeConfig(job.type);
              
              return (
                <Card 
                  key={job.id} 
                  className="p-6 bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                            {job.salary && typeof job.salary === 'object' && 'min' in job.salary && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                <DollarSign className="w-4 h-4" />
                                {job.salary.currency} {job.salary.min?.toLocaleString()} - {job.salary.max?.toLocaleString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                              <Calendar className="w-4 h-4" />
                              Posted {job.createdAt?.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges & Stats */}
                    <div className="flex flex-wrap items-center gap-3 lg:flex-shrink-0">
                      <Badge className={`${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                        {job.type}
                      </Badge>
                      {job.isReferral && (
                        <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/30">
                          Referral
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/30 rounded-lg">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-medium">{job.applicationsCount || 0}</span>
                        <span className="text-slate-400 text-sm">apps</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewJob(job)}
                        className="bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-600/30 hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        onClick={() => handleDeleteClick(job)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <Card className="p-4 bg-slate-800/30 border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{startRecord}</span> to <span className="font-medium text-white">{endRecord}</span> of <span className="font-medium text-white">{filteredJobs.length}</span> jobs
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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
                  <span className="px-3 text-slate-400 text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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

      {/* View Job Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeConfig(selectedJob?.type || '').color} flex items-center justify-center`}>
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              {selectedJob?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">Type</div>
                  <Badge className={`${getTypeConfig(selectedJob.type).bg} ${getTypeConfig(selectedJob.type).text} ${getTypeConfig(selectedJob.type).border}`}>
                    {selectedJob.type}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">Location</div>
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedJob.location}
                  </div>
                </div>
                {selectedJob.salary && typeof selectedJob.salary === 'object' && 'min' in selectedJob.salary && (
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Salary Range</div>
                    <div className="flex items-center gap-1.5 text-white">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      {selectedJob.salary.currency} {selectedJob.salary.min?.toLocaleString()} - {selectedJob.salary.max?.toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1">Applications</div>
                  <div className="flex items-center gap-1.5 text-white">
                    <Users className="w-4 h-4 text-slate-400" />
                    {selectedJob.applicationsCount || 0} applicants
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="text-sm text-slate-400 mb-2">Description</div>
                <div className="text-slate-300 whitespace-pre-wrap">{selectedJob.description}</div>
              </div>

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-sm text-slate-400 mb-2">Requirements</div>
                  <ul className="space-y-2">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedJob as any).skills && (selectedJob as any).skills.length > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <div className="text-sm text-slate-400 mb-2">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedJob as any).skills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                        <Tag className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)} 
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              Delete Job Post
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete <span className="text-white font-medium">&quot;{selectedJob?.title}&quot;</span> at {selectedJob?.company}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
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
