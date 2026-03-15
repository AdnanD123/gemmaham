import { useEffect, useState, useCallback } from "react";
import { onAuthChange, signIn, signUp, signInWithGoogle, signOut, getIdToken } from "../auth";
import { getUserProfile } from "../firestore";
import type { User } from "firebase/auth";
import type { UserRole, AuthContext } from "@gemmaham/shared";

export function useAuth(): AuthContext {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const loadUserProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setRole(profile.role || null);
        setCompanyId(profile.companyId || null);
        setProfileCompleted(profile.profileCompleted ?? false);
      } else {
        setRole(null);
        setCompanyId(null);
        setProfileCompleted(false);
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
      setRole(null);
      setCompanyId(null);
      setProfileCompleted(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadUserProfile(firebaseUser.uid);
      } else {
        setRole(null);
        setCompanyId(null);
        setProfileCompleted(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await signIn(email, password);
    await loadUserProfile(result.uid);
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await signUp(email, password, displayName);
    return result;
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const result = await signInWithGoogle();
    return result;
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setRole(null);
    setCompanyId(null);
    setProfileCompleted(false);
  }, []);

  const handleRefreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  }, [user]);

  return {
    user: user
      ? { uid: user.uid, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified }
      : null,
    loading,
    role,
    companyId,
    profileCompleted,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    refreshProfile: handleRefreshProfile,
  };
}

export { getIdToken };
