"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle, signInWithGithub, getUserData } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await signIn(email, password);
      
      // Check if user has completed onboarding
      const userData = await getUserData(user.uid);
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      
      // Redirect based on onboarding status
      if (userData && !userData.onboardingComplete) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/dashboard";
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log("Starting Google sign-in...");
      const result = await signInWithGoogle();
      
      console.log("Google sign-in result:", result);
      
      if (result) {
        const { user, isNewUser } = result;
        
        console.log("User signed in:", { uid: user.uid, isNewUser });
        
        toast({
          title: "Success",
          description: "Signed in with Google successfully!",
        });
        
        // If new user, go to onboarding; if existing, check onboarding status
        if (isNewUser) {
          console.log("New user - redirecting to onboarding");
          window.location.href = "/onboarding";
        } else {
          console.log("Existing user - checking onboarding status");
          const userData = await getUserData(user.uid);
          console.log("User data:", userData);
          
          if (userData && !userData.onboardingComplete) {
            console.log("Onboarding incomplete - redirecting to onboarding");
            window.location.href = "/onboarding";
          } else {
            console.log("Onboarding complete - redirecting to dashboard");
            window.location.href = "/dashboard";
          }
        }
      } else {
        console.log("Result is null - likely using redirect mode");
        // If result is null, redirect mode is being used
        // The redirect will handle navigation automatically
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    try {
      console.log("Starting GitHub sign-in...");
      const result = await signInWithGithub();
      
      console.log("GitHub sign-in result:", result);
      
      if (result) {
        const { user, isNewUser } = result;
        
        console.log("User signed in:", { uid: user.uid, isNewUser });
        
        toast({
          title: "Success",
          description: "Signed in with GitHub successfully!",
        });
        
        // If new user, go to onboarding; if existing, check onboarding status
        if (isNewUser) {
          console.log("New user - redirecting to onboarding");
          window.location.href = "/onboarding";
        } else {
          console.log("Existing user - checking onboarding status");
          const userData = await getUserData(user.uid);
          console.log("User data:", userData);
          
          if (userData && !userData.onboardingComplete) {
            console.log("Onboarding incomplete - redirecting to onboarding");
            window.location.href = "/onboarding";
          } else {
            console.log("Onboarding complete - redirecting to dashboard");
            window.location.href = "/dashboard";
          }
        }
      } else {
        console.log("Result is null - likely using redirect mode");
      }
    } catch (error: any) {
      console.error("GitHub sign-in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with GitHub",
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
            <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CampusLink</span>
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-black hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold group" 
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={loading}
                onClick={handleGoogleSignIn}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={loading}
                onClick={handleGithubSignIn}
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-gray-900 hover:underline">
                Sign up for free
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-gray-900 via-gray-800 to-black p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]" />
        <div className="relative z-10 max-w-lg space-y-8 text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">Trusted by 10,000+ students</span>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight">
            Connect with verified alumni mentors
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            Join CampusLink to access exclusive mentorship, job opportunities, and networking with verified alumni from top institutions.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-gray-400">Job Postings</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">1.2k+</div>
              <div className="text-gray-400">Referrals</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">85%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

