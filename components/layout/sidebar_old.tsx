"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = {
  student: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse Users", href: "/users", icon: Users },
    { name: "Find Mentors", href: "/mentorship", icon: GraduationCap },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Browse Jobs", href: "/jobs", icon: Briefcase },
    { name: "My Applications", href: "/jobs/my-applications", icon: FileText },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  alumni: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse Users", href: "/users", icon: Users },
    { name: "Mentorship Requests", href: "/mentorship", icon: GraduationCap },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Post a Job", href: "/jobs/create", icon: PlusCircle },
    { name: "My Job Posts", href: "/jobs/my-posts", icon: Folder },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  mentor: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse Users", href: "/users", icon: Users },
    { name: "Mentorship Requests", href: "/mentorship", icon: GraduationCap },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Browse Jobs", href: "/jobs", icon: Briefcase },
    { name: "Post a Job", href: "/jobs/create", icon: PlusCircle },
    { name: "My Job Posts", href: "/jobs/my-posts", icon: Folder },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  aspirant: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse Users", href: "/users", icon: Users },
    { name: "Find Mentors", href: "/mentorship", icon: GraduationCap },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { name: "Admin Panel", href: "/admin", icon: Settings },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"student" | "alumni" | "aspirant" | "admin" | "mentor">(() => {
    // Try to get cached role from localStorage on initial render
    if (typeof window !== 'undefined') {
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole && ['student', 'alumni', 'aspirant', 'admin', 'mentor'].includes(cachedRole)) {
        return cachedRole as "student" | "alumni" | "aspirant" | "admin" | "mentor";
      }
    }
    return "student"; // Fallback default
  });
  const [collapsed, setCollapsed] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Memoize user ID to prevent unnecessary fetches
  const userId = user?.uid || null;

  useEffect(() => {
    // Only fetch if user ID changed and not currently fetching
    if (userId && userId !== userIdRef.current && !isFetchingRef.current) {
      userIdRef.current = userId;
      isFetchingRef.current = true;
      
      import("@/lib/firebase/auth").then(({ getUserData }) => {
        getUserData(userId)
          .then((userData) => {
            if (userData?.role) {
              setUserRole(userData.role);
              // Cache the role in localStorage
              localStorage.setItem('userRole', userData.role);
            }
          })
          .catch(() => {
            // Keep the current role if fetch fails
          })
          .finally(() => {
            isFetchingRef.current = false;
          });
      });
    }
  }, [userId]);

  const handleSignOut = async () => {
    await signOut();
    // Clear cached role on sign out
    localStorage.removeItem('userRole');
    router.push("/login");
  };

  if (!user) return null;

  const navItems = navigation[userRole];

  return (
    <div 
      className={cn(
        "flex h-screen flex-col border-r bg-white shadow-lg transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6 bg-linear-to-r from-blue-50 to-indigo-50">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CampusLink
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full group">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative group",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-gray-600")} />
              {!collapsed && <span>{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-100 p-4">
        {!collapsed ? (
          <>
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-linear-to-r from-gray-50 to-blue-50">
              <Avatar className="h-10 w-10 ring-2 ring-blue-500 ring-offset-2">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                  {user.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="w-full justify-center text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-xl"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

