"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Users, 
  FileCheck, 
  Briefcase, 
  UserPlus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  BarChart3,
  PieChart
} from "lucide-react";
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
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      
      if (!db) throw new Error("Firestore not initialized");

      const verificationsSnapshot = await getDocs(collection(db, "verificationRequests"));
      const verifications = verificationsSnapshot.docs.map(doc => doc.data());
      
      const pendingVerifications = verifications.filter(v => v.status === "pending").length;
      const approvedVerifications = verifications.filter(v => v.status === "approved").length;
      const rejectedVerifications = verifications.filter(v => v.status === "rejected").length;

      const usersSnapshot = await getDocs(collection(db, "users"));
      const totalUsers = usersSnapshot.size;

      const reportsSnapshot = await getDocs(collection(db, "userReports"));
      const reports = reportsSnapshot.docs.map(doc => doc.data());
      
      const pendingReports = reports.filter(r => r.status === "pending").length;
      const resolvedReports = reports.filter(r => r.status === "resolved" || r.status === "dismissed").length;

      const jobsSnapshot = await getDocs(collection(db, "jobPostings"));
      const jobs = jobsSnapshot.docs.map(doc => doc.data());
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(j => j.status === "active" || !j.status).length;

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      description: "Registered members",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: FileCheck,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      description: `${stats.approvedVerifications} approved`,
      urgent: stats.pendingVerifications > 0,
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Briefcase,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/10",
      description: `${stats.totalJobs} total posts`,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Mentorships",
      value: stats.activeMentorships,
      icon: UserPlus,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      description: `${stats.totalMentorships} connections`,
      trend: "+24%",
      trendUp: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
            </div>
            <p className="text-slate-400">Welcome back! Here&apos;s what&apos;s happening on your platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">System Online</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden p-6 bg-gradient-to-br ${stat.bgGradient} border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group`}
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.urgent && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
                      Needs Attention
                    </Badge>
                  )}
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {stat.trend}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Actions */}
          <Card className="col-span-1 lg:col-span-2 p-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pending Actions</h3>
                  <p className="text-sm text-slate-400">Items requiring your attention</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link href="/admin/verifications" className="block group">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium group-hover:text-amber-400 transition-colors">Verification Requests</p>
                      <p className="text-sm text-slate-400">Student ID verifications awaiting review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stats.pendingVerifications > 0 && (
                      <span className="text-2xl font-bold text-amber-400">{stats.pendingVerifications}</span>
                    )}
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
              
              <Link href="/admin/reports" className="block group">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium group-hover:text-red-400 transition-colors">User Reports</p>
                      <p className="text-sm text-slate-400">Flagged content and user complaints</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stats.pendingReports > 0 && (
                      <span className="text-2xl font-bold text-red-400">{stats.pendingReports}</span>
                    )}
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Verification Stats</h3>
                <p className="text-sm text-slate-400">All-time overview</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Approved</span>
                </div>
                <span className="text-white font-semibold">{stats.approvedVerifications}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-300">Pending</span>
                </div>
                <span className="text-white font-semibold">{stats.pendingVerifications}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-slate-300">Rejected</span>
                </div>
                <span className="text-white font-semibold">{stats.rejectedVerifications}</span>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Approval Rate</span>
                  <span>
                    {stats.approvedVerifications + stats.rejectedVerifications > 0
                      ? Math.round((stats.approvedVerifications / (stats.approvedVerifications + stats.rejectedVerifications)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.approvedVerifications + stats.rejectedVerifications > 0
                        ? (stats.approvedVerifications / (stats.approvedVerifications + stats.rejectedVerifications)) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Navigation */}
        <Card className="p-6 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Quick Navigation</h3>
              <p className="text-sm text-slate-400">Jump to any section</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { href: "/admin/users", icon: Users, label: "Users", color: "from-blue-500 to-cyan-500" },
              { href: "/admin/posts", icon: Briefcase, label: "Jobs", color: "from-emerald-500 to-green-500" },
              { href: "/admin/verifications", icon: FileCheck, label: "Verify", color: "from-amber-500 to-orange-500" },
              { href: "/admin/reports", icon: AlertTriangle, label: "Reports", color: "from-red-500 to-rose-500" },
              { href: "/admin/activity-logs", icon: Activity, label: "Logs", color: "from-purple-500 to-pink-500" },
              { href: "/dashboard", icon: BarChart3, label: "Main App", color: "from-slate-500 to-slate-600" },
            ].map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="group p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 text-center hover:-translate-y-1">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Database Health Monitor */}
        <DatabaseHealthMonitor />
      </div>
    </AdminLayout>
  );
}
