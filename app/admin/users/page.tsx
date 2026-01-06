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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/lib/utils/error-handling";
import { User as UserType, UserRole } from "@/types";
import { 
  Users, 
  Search,
  Edit,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  FileDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  GraduationCap,
  Briefcase,
  Star,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";
import { logAdminActivity } from "@/lib/firebase/adminLogs";
import { downloadCSV, prepareUsersExport } from "@/lib/utils/exportData";

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

export default function AdminUsersPage() {
  useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>("student");
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    }
    
    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Filter by verification status
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.verificationStatus === statusFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { collection, getDocs, orderBy, query, getCountFromServer } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      const countSnapshot = await getCountFromServer(collection(db, "users"));
      setTotalRecords(countSnapshot.data().count);

      const q = query(
        collection(db, "users"), 
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as UserType[];

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setEditRole(user.role || "student");
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      const { auth } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      const oldRole = selectedUser.role;
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        role: editRole,
        updatedAt: serverTimestamp(),
      });

      if (auth && auth.currentUser) {
        await logAdminActivity({
          adminId: auth.currentUser.uid,
          adminEmail: auth.currentUser.email || "Unknown",
          adminName: auth.currentUser.displayName || "Admin",
          action: "update_user_role",
          targetType: "user",
          targetId: selectedUser.id,
          targetName: selectedUser.displayName || selectedUser.email,
          details: `Updated user role from ${oldRole} to ${editRole}`,
          metadata: {
            oldRole,
            newRole: editRole,
            userId: selectedUser.id,
          },
        });
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setEditDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleConfig = (role?: UserRole) => {
    switch (role) {
      case "admin": return { color: "from-red-500 to-rose-500", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: Shield };
      case "alumni": return { color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", icon: GraduationCap };
      case "aspirant": return { color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: Star };
      case "student": return { color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", icon: UserCircle };
      default: return { color: "from-slate-500 to-slate-600", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: UserCircle };
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">Unverified</Badge>;
    }
  };

  const getUserInitial = (user: UserType) => {
    return user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";
  };

  const getAvatarGradient = (index: number) => {
    const gradients = [
      "from-pink-500 to-rose-500",
      "from-amber-500 to-orange-500",
      "from-purple-500 to-violet-500",
      "from-emerald-500 to-green-500",
      "from-blue-500 to-cyan-500",
      "from-red-500 to-pink-500",
      "from-teal-500 to-cyan-500",
      "from-indigo-500 to-purple-500",
    ];
    return gradients[index % gradients.length];
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export handler
  const handleExport = () => {
    try {
      const exportData = prepareUsersExport(filteredUsers);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(
        exportData,
        [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'verified', label: 'Verified' },
          { key: 'createdAt', label: 'Joined Date' },
        ],
        `users-${timestamp}`
      );
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} users`,
      });
    } catch (error) {
      handleError(error, "Failed to export data");
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  // Stats
  const stats = {
    total: users.length,
    verified: users.filter(u => u.verificationStatus === "approved").length,
    pending: users.filter(u => u.verificationStatus === "pending").length,
    admins: users.filter(u => u.role === "admin").length,
    alumni: users.filter(u => u.role === "alumni").length,
    students: users.filter(u => u.role === "student").length,
    aspirants: users.filter(u => u.role === "aspirant").length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">User Management</h1>
            </div>
            <p className="text-slate-400">{users.length} users registered on the platform</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadUsers}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
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
            { label: "Verified", value: stats.verified, color: "from-emerald-500 to-green-500" },
            { label: "Pending", value: stats.pending, color: "from-amber-500 to-orange-500" },
            { label: "Students", value: stats.students, color: "from-blue-500 to-cyan-500" },
            { label: "Alumni", value: stats.alumni, color: "from-purple-500 to-violet-500" },
            { label: "Aspirants", value: stats.aspirants, color: "from-pink-500 to-rose-500" },
            { label: "Admins", value: stats.admins, color: "from-red-500 to-rose-500" },
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
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="alumni">Alumni</option>
                <option value="aspirant">Aspirants</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-4 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="approved">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-900/30">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description={searchQuery || roleFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters" : "No users in the system yet"}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => {
                    const roleConfig = getRoleConfig(user.role);
                    const RoleIcon = roleConfig.icon;
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(index)} flex items-center justify-center text-white font-semibold shadow-lg`}>
                              {getUserInitial(user)}
                            </div>
                            <div>
                              <div className="text-white font-medium group-hover:text-blue-400 transition-colors">{user.displayName || "No Name"}</div>
                              <div className="flex items-center gap-1 text-slate-400 text-sm">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${roleConfig.bg} ${roleConfig.text} ${roleConfig.border} flex items-center gap-1.5 w-fit`}>
                            <RoleIcon className="h-3 w-3" />
                            {user.role || "student"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          {getVerificationBadge(user.verificationStatus)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            {user.createdAt?.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/profile/${user.id}`)}
                              className="bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-600/30 hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit className="h-4 w-4 mr-1.5" />
                              Edit Role
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-400">
                  Showing <span className="font-medium text-white">{startRecord}</span> to <span className="font-medium text-white">{endRecord}</span> of <span className="font-medium text-white">{filteredUsers.length}</span> users
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={currentPage === pageNum 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
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
            </div>
          )}
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Edit User Role
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Change the role for <span className="text-white font-medium">{selectedUser?.displayName || selectedUser?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-slate-300">Select New Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "student", label: "Student", icon: UserCircle, color: "from-emerald-500 to-green-500" },
                  { value: "alumni", label: "Alumni", icon: GraduationCap, color: "from-purple-500 to-violet-500" },
                  { value: "aspirant", label: "Aspirant", icon: Star, color: "from-blue-500 to-cyan-500" },
                  { value: "admin", label: "Admin", icon: Shield, color: "from-red-500 to-rose-500" },
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setEditRole(role.value as UserRole)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editRole === role.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-2`}>
                      <role.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white">{role.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400">
                <strong>Note:</strong> Changing user roles will affect their permissions and access to features.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
              className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </div>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Update Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
