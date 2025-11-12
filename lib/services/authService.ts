/**
 * Unified Authentication Service
 * 
 * Handles all authentication methods (email, Google, GitHub) with consistent logic
 * Manages user creation, updates, and post-auth routing
 */

import { User as FirebaseUser } from "firebase/auth";
import {
  signIn as emailSignIn,
  signUp as emailSignUp,
  signInWithGoogle as googleAuth,
  signInWithGithub as githubAuth,
  getUserData,
} from "@/lib/firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { User, UserRole } from "@/types";

export interface AuthCredentials {
  email?: string;
  password?: string;
  displayName?: string;
  role?: UserRole;
}

export interface AuthResult {
  user: FirebaseUser;
  userData: User | null;
  isNewUser: boolean;
  destination: string;
}

class AuthenticationService {
  /**
   * Unified authentication method
   * Handles email, Google, and GitHub authentication with consistent logic
   */
  async authenticate(
    method: "email-signup" | "email-signin" | "google" | "github",
    credentials: AuthCredentials
  ): Promise<AuthResult> {
    let firebaseUser: FirebaseUser;
    let isNewUser = false;

    // Step 1: Perform authentication based on method
    switch (method) {
      case "email-signup":
        if (!credentials.email || !credentials.password || !credentials.displayName || !credentials.role) {
          throw new Error("Missing required credentials for email signup");
        }
        firebaseUser = await emailSignUp(
          credentials.email,
          credentials.password,
          credentials.displayName,
          credentials.role
        );
        isNewUser = true;
        break;

      case "email-signin":
        if (!credentials.email || !credentials.password) {
          throw new Error("Missing required credentials for email signin");
        }
        firebaseUser = await emailSignIn(credentials.email, credentials.password);
        break;

      case "google":
        const googleResult = await googleAuth(credentials.role);
        if (!googleResult) {
          throw new Error("OAuth redirect initiated - no immediate result");
        }
        firebaseUser = googleResult.user;
        isNewUser = googleResult.isNewUser;
        break;

      case "github":
        const githubResult = await githubAuth(credentials.role);
        if (!githubResult) {
          throw new Error("OAuth redirect initiated - no immediate result");
        }
        firebaseUser = githubResult.user;
        isNewUser = githubResult.isNewUser;
        break;

      default:
        throw new Error(`Unknown authentication method: ${method}`);
    }

    // Step 2: Update login tracking
    await this.updateLoginTracking(firebaseUser.uid);

    // Step 3: Fetch complete user data
    const userData = await getUserData(firebaseUser.uid);

    // Step 4: Determine post-auth destination
    const destination = await this.determineDestination(userData, isNewUser);

    return {
      user: firebaseUser,
      userData,
      isNewUser,
      destination,
    };
  }

  /**
   * Update user's login tracking information
   */
  private async updateLoginTracking(userId: string): Promise<void> {
    if (!db) return;

    try {
      const userRef = doc(db, "users", userId);
      const userData = await getUserData(userId);

      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: (userData?.loginCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update login tracking:", error);
      // Non-critical error, don't block authentication
    }
  }

  /**
   * Smart routing logic - determines where user should go after authentication
   * Priority order:
   * 1. Onboarding incomplete -> /onboarding
   * 2. Account suspended -> /suspended
   * 3. Verification rejected -> /verification/resubmit  
   * 4. Verification pending -> /dashboard (with banner)
   * 5. Default -> /dashboard
   */
  async determineDestination(userData: User | null, isNewUser: boolean): Promise<string> {
    // New users always go to onboarding
    if (isNewUser) {
      return "/onboarding";
    }

    // Handle missing user data
    if (!userData) {
      console.error("User data not found after authentication");
      return "/error?message=user-data-missing";
    }

    // Priority 1: Complete onboarding first
    if (!userData.onboardingComplete) {
      // Resume from last step if available
      const step = userData.onboardingStep || 1;
      return `/onboarding?step=${step}`;
    }

    // Priority 2: Check account status
    if (userData.accountStatus === "suspended") {
      return "/account/suspended";
    }

    if (userData.accountStatus === "deleted") {
      return "/account/deleted";
    }

    // Priority 3: Handle verification status
    switch (userData.verificationStatus) {
      case "rejected":
        return "/verification/resubmit";
      
      case "pending":
        // Allow access but show pending banner
        return "/dashboard?verification=pending";
      
      case "unverified":
        // Onboarding complete but no verification submitted
        // Allow limited access
        return "/dashboard?verification=required";
      
      case "approved":
      default:
        // Full access
        return "/dashboard";
    }
  }

  /**
   * Get user's access level based on verification status
   */
  getUserAccessLevel(userData: User | null): "full" | "limited" | "restricted" | "none" {
    if (!userData) return "none";

    // Account issues
    if (userData.accountStatus === "suspended" || userData.accountStatus === "deleted") {
      return "none";
    }

    // Onboarding not complete
    if (!userData.onboardingComplete) {
      return "restricted";
    }

    // Verification status
    switch (userData.verificationStatus) {
      case "approved":
        return "full";
      
      case "pending":
      case "unverified":
        return "limited";
      
      case "rejected":
        return "restricted";
      
      default:
        return "limited";
    }
  }

  /**
   * Check if user can perform specific action based on their access level
   */
  canUserPerformAction(
    userData: User | null,
    action: "view_profiles" | "send_mentorship" | "post_jobs" | "apply_jobs" | "chat"
  ): boolean {
    const accessLevel = this.getUserAccessLevel(userData);

    const permissions: Record<string, string[]> = {
      full: ["view_profiles", "send_mentorship", "post_jobs", "apply_jobs", "chat"],
      limited: ["view_profiles", "apply_jobs"],
      restricted: [],
      none: [],
    };

    return permissions[accessLevel].includes(action);
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Export types
export type { AuthenticationService };
