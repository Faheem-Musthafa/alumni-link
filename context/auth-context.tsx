"use client";

import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, getUserData } from "@/lib/firebase/auth";
import { User } from "@/types";
import { USER_ROLES } from "@/lib/constants";

interface AuthContextValue {
  user: (User & { uid: string }) | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<(User & { uid: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const userData = await getUserData(fbUser.uid);
      if (userData) {
        setUser({ ...userData, uid: fbUser.uid });
        // Cache user role
        if (userData.role) {
          localStorage.setItem('userRole', userData.role);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser);
    }
  }, [firebaseUser, loadUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await loadUserData(fbUser);
      } else {
        setUser(null);
        localStorage.removeItem('userRole');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
    
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      window.location.href = "/dashboard";
    }
  }, [user, loading, requiredRole]);
  
  return { user, loading };
}
