import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";
import type { UserRole } from "@gemmaham/shared";

const googleProvider = new GoogleAuthProvider();

export const signUp = async (email: string, password: string, displayName: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
};

export const signIn = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signInWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const setUserClaims = async (
  role: UserRole,
  companyId?: string,
): Promise<{ success: boolean; role: UserRole; companyId: string | null }> => {
  const fn = httpsCallable<
    { role: UserRole; companyId?: string },
    { success: boolean; role: UserRole; companyId: string | null }
  >(functions, "setUserClaims");
  const result = await fn({ role, companyId });
  // Force-refresh the ID token so the client SDK picks up new custom claims
  await auth.currentUser?.getIdToken(true);
  return result.data;
};
