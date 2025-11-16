'use client';
import { enableNetwork } from "firebase/firestore";

import React, { createContext, useContext,useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthContext as AuthContextType } from "@/types/AuthContext";
import {db} from '@/lib/firebase'

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  useEffect(() => {
  enableNetwork(db).catch((e) => console.warn("Network already enabled:", e));
}, []);
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthProvider");
  return context;
}
