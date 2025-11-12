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
  ArrowLeft, 
  Search,
  Edit,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  UserCircle,
  Download,
  Filter,
  FileDown
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const { collection, getDocs, orderBy, query, limit, getCountFromServer } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      // Get total count
      const countSnapshot = await getCountFromServer(collection(db, "users"));
      setTotalRecords(countSnapshot.data().count);

      // Get paginated data
      const q = query(
        collection(db, "users"), 
        orderBy("createdAt", "desc"),
        limit(pageSize)
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

      // Log admin activity
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

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case "admin": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "alumni": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "mentor": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "student": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unverified</Badge>;
    }
  };

  const getUserInitial = (user: UserType) => {
    return user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-pink-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-red-500",
    ];
    return colors[index % colors.length];
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadUsers();
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadUsers();
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

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
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <p className="text-gray-400 text-sm">{users.length} total users registered</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1a1f2e] border-gray-800 text-white pl-10"
            />
          </div>
          <Button variant="outline" className="bg-[#1a1f2e] border-gray-800 text-white hover:bg-gray-800">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="bg-[#1a1f2e] border-gray-800 text-white hover:bg-gray-800"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white">{users.length}</div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Verified</div>
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.verificationStatus === "approved").length}
            </div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {users.filter(u => u.verificationStatus === "pending").length}
            </div>
          </Card>
          <Card className="bg-[#1a1f2e] border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-1">Admins</div>
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.role === "admin").length}
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-[#1a1f2e] border-gray-800">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Joined</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState
                          icon={Users}
                          title="No users found"
                          description={searchQuery ? "Try adjusting your search" : "No users in the system yet"}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white font-semibold`}>
                              {getUserInitial(user)}
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.displayName || "No Name"}</div>
                              <div className="text-gray-400 text-xs">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role || "student"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {getVerificationBadge(user.verificationStatus)}
                        </td>
                        <td className="py-4 px-4 text-gray-300 text-sm">
                          {user.createdAt?.toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalRecords > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    Showing {startRecord} to {endRecord} of {totalRecords} users
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="bg-[#0f1419] border border-gray-800 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-gray-400 hover:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-gray-400 hover:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#1a1f2e] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Change the role for {selectedUser?.displayName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">User Role</Label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full h-10 px-3 rounded-md bg-[#0f1419] border border-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> Changing user roles will affect their permissions and access to features.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
              className="bg-[#0f1419] border-gray-800 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
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
