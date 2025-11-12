"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, getUserData, handleAuthRedirect } from "@/lib/firebase/auth";
import { User } from "@/types";

interface AuthContextType {
  user: (User & { uid: string }) | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<(User & { uid: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result first
    handleAuthRedirect().then(result => {
      if (result?.user) {
        console.log("Auth redirect completed:", result.user.email);
        // If new user, they might need to go through onboarding
        if (result.isNewUser) {
          const pendingRole = sessionStorage.getItem('pendingAuthRole');
          if (pendingRole) {
            console.log("New user with role:", pendingRole);
            sessionStorage.removeItem('pendingAuthRole');
          }
        }
      }
    }).catch(err => {
      console.error("Error handling redirect:", err);
    });

    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const userData = await getUserData(fbUser.uid);
          if (userData) {
            setUser({ ...userData, uid: fbUser.uid });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, firebaseUser, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

