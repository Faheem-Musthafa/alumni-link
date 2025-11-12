"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { DatabaseHealthMonitor } from "@/components/admin/DatabaseHealthMonitor";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    totalUsers: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalMentorships: 0,
    activeMentorships: 0,
  });

  useEffect(() => {
    // Check admin authentication first
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin/login");
      return;
    }
    setAdminAuthenticated(true);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      // Fetch real stats from Firestore
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      // Count verification requests by status
      const verificationsSnapshot = await getDocs(collection(db, "verificationRequests"));
      const verifications = verificationsSnapshot.docs.map(doc => doc.data());
      
      const pendingVerifications = verifications.filter(v => v.status === "pending").length;
      const approvedVerifications = verifications.filter(v => v.status === "approved").length;
      const rejectedVerifications = verifications.filter(v => v.status === "rejected").length;

      // Count total users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;

      // Count reports by status
      const reportsSnapshot = await getDocs(collection(db, "userReports"));
      const reports = reportsSnapshot.docs.map(doc => doc.data());
      
      const pendingReports = reports.filter(r => r.status === "pending").length;
      const resolvedReports = reports.filter(r => r.status === "resolved" || r.status === "dismissed").length;

      // Count jobs
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobs = jobsSnapshot.docs.map(doc => doc.data());
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(j => j.status === "active" || !j.status).length;

      // Count mentorships
      const mentorshipsSnapshot = await getDocs(collection(db, "mentorshipRequests"));
      const mentorships = mentorshipsSnapshot.docs.map(doc => doc.data());
      const totalMentorships = mentorships.length;
      const activeMentorships = mentorships.filter(m => m.status === "accepted" || m.status === "active").length;

      setStats({
        pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        totalUsers,
        pendingReports,
        resolvedReports,
        totalJobs,
        activeJobs,
        totalMentorships,
        activeMentorships,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };



  if (!adminAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Comprehensive overview of platform metrics and activity</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-2">Registered members</p>
          </Card>

          {/* Verifications */}
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Verifications</p>
              <span className="text-2xl">✅</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-orange-500">{stats.pendingVerifications}</p>
              <span className="text-sm text-gray-400">pending</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.approvedVerifications} approved, {stats.rejectedVerifications} rejected
            </p>
          </Card>

          {/* Job Posts */}
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Job Posts</p>
              <span className="text-2xl">💼</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-500">{stats.activeJobs}</p>
              <span className="text-sm text-gray-400">active</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats.totalJobs} total posts</p>
          </Card>

          {/* Mentorships */}
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Mentorships</p>
              <span className="text-2xl">🤝</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-green-500">{stats.activeMentorships}</p>
              <span className="text-sm text-gray-400">active</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats.totalMentorships} total connections</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Pending Actions</h3>
            <div className="space-y-3">
              <Link href="/admin/verifications">
                <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <span className="text-orange-500 text-lg">✅</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Verification Requests</p>
                      <p className="text-sm text-gray-400">Review pending IDs</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">{stats.pendingVerifications}</span>
                </div>
              </Link>
              
              <Link href="/admin/reports">
                <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-lg">⚠️</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">User Reports</p>
                      <p className="text-sm text-gray-400">Review flagged content</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-500">{stats.pendingReports}</span>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-[#1a1f2e] border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users">
                <div className="p-4 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-center">
                  <p className="text-2xl mb-2">👥</p>
                  <p className="text-sm text-gray-300 font-medium">Manage Users</p>
                </div>
              </Link>
              <Link href="/admin/posts">
                <div className="p-4 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-center">
                  <p className="text-2xl mb-2">💼</p>
                  <p className="text-sm text-gray-300 font-medium">Job Posts</p>
                </div>
              </Link>
              <Link href="/admin/verifications">
                <div className="p-4 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-sm text-gray-300 font-medium">Verifications</p>
                </div>
              </Link>
              <Link href="/admin/activity-logs">
                <div className="p-4 bg-[#0f1419] rounded-lg hover:bg-gray-800 transition-colors cursor-pointer text-center">
                  <p className="text-2xl mb-2">📊</p>
                  <p className="text-sm text-gray-300 font-medium">Activity Logs</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Database Health Monitor */}
        <DatabaseHealthMonitor />

      </div>
    </AdminLayout>
  );
}
