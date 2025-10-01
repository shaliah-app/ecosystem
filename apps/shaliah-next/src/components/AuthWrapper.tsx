'use client'

import { AuthForm } from "@/components/AuthForm";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/lib/auth/store";

export function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return user ? <UserProfile /> : <AuthForm />;
}