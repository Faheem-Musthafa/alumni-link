"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCard } from "@/components/shared/user-card";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { getUserProfile } from "@/lib/firebase/profiles";
import { getDocuments } from "@/lib/firebase/firestore-helpers";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { handleError } from "@/lib/utils/error-handling";
import { useEffect, useState } from "react";
import { User, UserProfile } from "@/types";
import { Search, Users, X, FilterX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrowseUsersPage() {
  const { user, loading: authLoading } = useVerificationGuard();
  const [users, setUsers] = useState<User[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getDocuments<User>(FIRESTORE_COLLECTIONS.USERS);
        const filteredUsers = usersData.filter(
          (u) => u.id !== user?.uid && u.role !== "admin"
        );

        setUsers(filteredUsers);

        const profilesData: Record<string, UserProfile> = {};
        await Promise.all(
          filteredUsers.map(async (u) => {
            const profile = await getUserProfile(u.id);
            if (profile) {
              profilesData[u.id] = profile;
            }
          })
        );

        setUserProfiles(profilesData);
      } catch (error) {
        handleError(error, "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUsers();
    }
  }, [user]);

  const colleges = Array.from(
    new Set(Object.values(userProfiles).map((p) => p.college).filter((c) => c))
  ).sort();

  const filteredUsers = users.filter((u) => {
    const profile = userProfiles[u.id];
    if (!profile) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      u.displayName?.toLowerCase().includes(searchLower) ||
      profile.college?.toLowerCase().includes(searchLower) ||
      profile.currentCompany?.toLowerCase().includes(searchLower) ||
      profile.jobTitle?.toLowerCase().includes(searchLower) ||
      profile.location?.toLowerCase().includes(searchLower) ||
      profile.skills?.some((s) => s.toLowerCase().includes(searchLower));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesCollege = collegeFilter === "all" || profile.college === collegeFilter;

    return matchesSearch && matchesRole && matchesCollege;
  });

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" message="Loading users..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Browse Users"
          description="Connect with students, alumni, and aspirants from your network"
        />

        <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, college, company, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-44 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="aspirant">Aspirants</SelectItem>
                </SelectContent>
              </Select>

              {colleges.length > 0 && (
                <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                  <SelectTrigger className="w-full md:w-52 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="College" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Colleges</SelectItem>
                    {colleges.map((college) => (
                      <SelectItem key={college} value={college || ""}>
                        {college}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(roleFilter !== "all" || collegeFilter !== "all" || searchQuery) && (
                <ActionButton
                  variant="outline"
                  onClick={() => {
                    setRoleFilter("all");
                    setCollegeFilter("all");
                    setSearchQuery("");
                  }}
                  icon={<FilterX className="h-4 w-4" />}
                  className="h-12 rounded-xl border-2"
                >
                  Clear
                </ActionButton>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-gray-600 font-medium">
            <span className="text-gray-900 font-bold">{filteredUsers.length}</span> {filteredUsers.length === 1 ? "user" : "users"} found
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="py-16">
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try adjusting your search or filters to find more users"
                action={
                  <ActionButton
                    variant="outline"
                    icon={<FilterX className="h-4 w-4" />}
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("all");
                      setCollegeFilter("all");
                    }}
                    className="rounded-full border-2"
                  >
                    Clear All Filters
                  </ActionButton>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((u) => {
              const profile = userProfiles[u.id];
              if (!profile) return null;

              return <UserCard key={u.id} user={u} profile={profile} />;
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
