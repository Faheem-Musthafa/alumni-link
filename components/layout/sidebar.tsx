"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Briefcase,
  User,
  Settings,
  LogOut,
  GraduationCap,
  FileText,
  PlusCircle,
  Folder,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscribeToUnreadCount } from "@/lib/firebase/chat";

const navigation = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", badge: null, description: "Overview", dynamic: false },
    { name: "Browse Users", href: "/users", icon: Users, color: "from-purple-500 to-purple-600", badge: null, description: "Connect", dynamic: false },
    { name: "Find Mentors", href: "/mentorship", icon: GraduationCap, color: "from-green-500 to-green-600", badge: null, description: "Learn", dynamic: false },
    { name: "Messages", href: "/chat", icon: MessageSquare, color: "from-pink-500 to-pink-600", badge: null, description: "Chat", dynamic: true },
    { name: "Browse Jobs", href: "/jobs", icon: Briefcase, color: "from-orange-500 to-orange-600", badge: null, description: "Career", dynamic: false },
    { name: "My Applications", href: "/jobs/my-applications", icon: FileText, color: "from-indigo-500 to-indigo-600", badge: null, description: "Track", dynamic: false },
    { name: "Profile", href: "/profile", icon: User, color: "from-cyan-500 to-cyan-600", badge: null, description: "You", dynamic: false },
    { name: "Settings", href: "/settings", icon: Settings, color: "from-gray-500 to-gray-600", badge: null, description: "Preferences", dynamic: false },
  ],
  alumni: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", badge: null, description: "Overview", dynamic: false },
    { name: "Browse Users", href: "/users", icon: Users, color: "from-purple-500 to-purple-600", badge: null, description: "Network", dynamic: false },
    { name: "Mentorship Requests", href: "/mentorship", icon: GraduationCap, color: "from-green-500 to-green-600", badge: null, description: "Guide", dynamic: false },
    { name: "Messages", href: "/chat", icon: MessageSquare, color: "from-pink-500 to-pink-600", badge: null, description: "Chat", dynamic: true },
    { name: "Post a Job", href: "/jobs/create", icon: PlusCircle, color: "from-emerald-500 to-emerald-600", badge: null, description: "Recruit", dynamic: false },
    { name: "My Job Posts", href: "/jobs/my-posts", icon: Folder, color: "from-amber-500 to-amber-600", badge: null, description: "Manage", dynamic: false },
    { name: "Profile", href: "/profile", icon: User, color: "from-cyan-500 to-cyan-600", badge: null, description: "You", dynamic: false },
    { name: "Settings", href: "/settings", icon: Settings, color: "from-gray-500 to-gray-600", badge: null, description: "Preferences", dynamic: false },
  ],
  mentor: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", badge: null, description: "Overview", dynamic: false },
    { name: "Browse Users", href: "/users", icon: Users, color: "from-purple-500 to-purple-600", badge: null, description: "Network", dynamic: false },
    { name: "Mentorship Requests", href: "/mentorship", icon: GraduationCap, color: "from-green-500 to-green-600", badge: null, description: "Guide", dynamic: false },
    { name: "Messages", href: "/chat", icon: MessageSquare, color: "from-pink-500 to-pink-600", badge: null, description: "Chat", dynamic: true },
    { name: "Browse Jobs", href: "/jobs", icon: Briefcase, color: "from-orange-500 to-orange-600", badge: null, description: "Career", dynamic: false },
    { name: "Post a Job", href: "/jobs/create", icon: PlusCircle, color: "from-emerald-500 to-emerald-600", badge: null, description: "Recruit", dynamic: false },
    { name: "My Job Posts", href: "/jobs/my-posts", icon: Folder, color: "from-amber-500 to-amber-600", badge: null, description: "Manage", dynamic: false },
    { name: "Profile", href: "/profile", icon: User, color: "from-cyan-500 to-cyan-600", badge: null, description: "You", dynamic: false },
    { name: "Settings", href: "/settings", icon: Settings, color: "from-gray-500 to-gray-600", badge: null, description: "Preferences", dynamic: false },
  ],
  aspirant: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", badge: null, description: "Overview", dynamic: false },
    { name: "Browse Users", href: "/users", icon: Users, color: "from-purple-500 to-purple-600", badge: null, description: "Connect", dynamic: false },
    { name: "Find Mentors", href: "/mentorship", icon: GraduationCap, color: "from-green-500 to-green-600", badge: null, description: "Learn", dynamic: false },
    { name: "Messages", href: "/chat", icon: MessageSquare, color: "from-pink-500 to-pink-600", badge: null, description: "Chat", dynamic: true },
    { name: "Profile", href: "/profile", icon: User, color: "from-cyan-500 to-cyan-600", badge: null, description: "You", dynamic: false },
    { name: "Settings", href: "/settings", icon: Settings, color: "from-gray-500 to-gray-600", badge: null, description: "Preferences", dynamic: false },
  ],
  admin: [
    { name: "Admin Panel", href: "/admin", icon: Settings, color: "from-red-500 to-red-600", badge: null, description: "Control", dynamic: false },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", badge: null, description: "Overview", dynamic: false },
    { name: "Messages", href: "/chat", icon: MessageSquare, color: "from-pink-500 to-pink-600", badge: null, description: "Chat", dynamic: true },
    { name: "Profile", href: "/profile", icon: User, color: "from-cyan-500 to-cyan-600", badge: null, description: "You", dynamic: false },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"student" | "alumni" | "aspirant" | "admin" | "mentor">(() => {
    if (typeof window !== 'undefined') {
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole && ['student', 'alumni', 'aspirant', 'admin', 'mentor'].includes(cachedRole)) {
        return cachedRole as "student" | "alumni" | "aspirant" | "admin" | "mentor";
      }
    }
    return "student";
  });
  
  const userIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  const [unreadCount, setUnreadCount] = useState(0);

  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => user?.uid || null, [user?.uid]);

  useEffect(() => {
    // Only fetch once when component mounts or user changes
    if (userId && userId !== userIdRef.current && !isFetchingRef.current && !hasInitializedRef.current) {
      userIdRef.current = userId;
      isFetchingRef.current = true;
      hasInitializedRef.current = true;
      
      import("@/lib/firebase/auth").then(({ getUserData }) => {
        getUserData(userId)
          .then((userData) => {
            if (userData?.role) {
              setUserRole(userData.role);
              localStorage.setItem('userRole', userData.role);
            }
          })
          .catch(() => {})
          .finally(() => {
            isFetchingRef.current = false;
          });
      });
    }
  }, [userId]);

  // Subscribe to unread message count
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    localStorage.removeItem('userRole');
    router.push("/login");
  }, [router]);

  if (!user) return null;

  // Memoize navigation items to prevent recalculation
  const navItems = useMemo(() => navigation[userRole], [userRole]);

  return (
    <div className="flex h-screen w-72 flex-col bg-white border-r border-gray-100 shadow-sm overflow-hidden">
      {/* Premium Header - Static (no animation on pulse) */}
      <div className="relative h-24 flex items-center px-6 border-b border-gray-100 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        <Link href="/dashboard" className="relative flex items-center gap-3 group z-10">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            {/* Icon Container */}
            <div className="relative h-12 w-12 rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CampusLink
            </h1>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Connect & Grow
            </p>
          </div>
        </Link>
      </div>

      {/* Premium User Card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link href="/profile" className="block">
          <div className="relative group">
            {/* Card Background with Gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Card Content */}
            <div className="relative flex items-center gap-3 p-3 rounded-2xl">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg group-hover:ring-blue-500 transition-all">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Online Status */}
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation with Enhanced Design */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-2xl font-medium text-sm transition-all duration-200",
                  isActive
                    ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full"></div>
                )}
                
                {/* Icon Container with Gradient */}
                <div className={cn(
                  "relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-white/20 shadow-inner" 
                    : "bg-white border border-gray-100 group-hover:border-gray-200 group-hover:shadow-md group-hover:scale-105"
                )}>
                  {/* Gradient Background for Icon */}
                  {!isActive && (
                    <div className={cn("absolute inset-0 rounded-xl bg-linear-to-br opacity-10 group-hover:opacity-20 transition-opacity", item.color)}></div>
                  )}
                  <Icon className={cn(
                    "h-5 w-5 transition-all relative z-10",
                    isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
                  )} />
                </div>
                
                {/* Label & Description */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold truncate", isActive ? "text-white" : "text-gray-900")}>
                    {item.name}
                  </p>
                  <p className={cn("text-xs truncate", isActive ? "text-white/80" : "text-gray-500")}>
                    {item.description}
                  </p>
                </div>
                
                {/* Notification Badge */}
                {((item.dynamic && unreadCount > 0) || (!item.dynamic && item.badge && item.badge > 0)) && (
                  <Badge 
                    className={cn(
                      "h-6 min-w-6 px-2 text-xs font-bold shadow-lg",
                      isActive 
                        ? "bg-white text-blue-600" 
                        : "bg-red-500 text-white"
                    )}
                  >
                    {item.dynamic 
                      ? (unreadCount > 99 ? "99+" : unreadCount)
                      : (item.badge && item.badge > 99 ? "99+" : item.badge)
                    }
                  </Badge>
                )}
                
                {/* Hover Arrow */}
                {!isActive && (
                  <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                )}

                {/* Hover Highlight */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none",
                  item.color
                )}></div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Premium Sign Out Button */}
      <div className="p-4 border-t border-gray-100 bg-linear-to-b from-transparent via-gray-50/50 to-gray-50">
        <button
          onClick={handleSignOut}
          className="group w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-all duration-300 relative overflow-hidden"
        >
          {/* Hover Background Effect */}
          <div className="absolute inset-0 bg-red-500/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 group-hover:bg-red-100 transition-all duration-300">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="flex-1 text-left font-semibold relative">Sign Out</span>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative" />
        </button>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}

