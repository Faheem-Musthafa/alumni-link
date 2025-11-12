"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, User, Lock, ArrowRight, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify admin credentials from environment variables
      const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

      if (username === adminUsername && password === adminPassword) {
        // Store admin session
        sessionStorage.setItem("adminAuthenticated", "true");
        sessionStorage.setItem("adminUsername", username);
        
        toast({
          title: "Success",
          description: "Admin login successful!",
        });
        
        router.push("/admin");
      } else {
        toast({
          title: "Error",
          description: "Invalid admin credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CampusLink Admin</span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Admin Portal
            </h1>
            <p className="text-lg text-gray-600">
              Sign in with admin credentials
            </p>
          </div>

          {/* Admin Notice */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-sm">Restricted Access</h3>
                <p className="text-red-700 text-sm mt-1">
                  This area is for authorized administrators only. Unauthorized access attempts are logged.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-900">
                  Admin Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                  Admin Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-red-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold group" 
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in as Admin
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Not an admin?{" "}
              <Link href="/login" className="font-semibold text-gray-900 hover:underline">
                Go to user login
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Admin Illustration */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-red-900 via-red-800 to-red-950 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]" />
        <div className="relative z-10 max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Shield className="h-4 w-4 text-red-300" />
            <span className="text-sm font-medium">Secure Admin Portal</span>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight">
            Manage verifications & user access
          </h2>
          
          <p className="text-xl text-red-100 leading-relaxed">
            Review and approve student verifications, manage user reports, and maintain platform integrity.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold">Verify</div>
              <div className="text-red-200">Student Requests</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">Review</div>
              <div className="text-red-200">User Reports</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">Monitor</div>
              <div className="text-red-200">Platform Activity</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">Secure</div>
              <div className="text-red-200">User Data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
