import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { UserRole } from "@gemmaham/shared";

export const acceptTeamInvite = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const { token } = request.data as { token: string };
  if (!token) {
    throw new HttpsError("invalid-argument", "Token is required");
  }

  const db = getFirestore();
  const uid = request.auth.uid;
  const userEmail = request.auth.token.email;

  // Find invite by token
  const inviteSnap = await db.collection("invites")
    .where("token", "==", token)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (inviteSnap.empty) {
    throw new HttpsError("not-found", "Invite not found or already used");
  }

  const inviteDoc = inviteSnap.docs[0];
  const invite = inviteDoc.data();

  // Verify email matches
  if (invite.email.toLowerCase() !== userEmail?.toLowerCase()) {
    throw new HttpsError("permission-denied", "This invite is for a different email address");
  }

  // Check expiry
  const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt);
  if (expiresAt < new Date()) {
    await inviteDoc.ref.update({ status: "expired" });
    throw new HttpsError("deadline-exceeded", "This invite has expired");
  }

  // Check if user already belongs to a company
  const existingClaims = (await getAuth().getUser(uid)).customClaims;
  if (existingClaims?.companyId && existingClaims.companyId !== invite.companyId) {
    throw new HttpsError("already-exists", "You already belong to a different company");
  }

  // Set custom claims
  await getAuth().setCustomUserClaims(uid, {
    role: "company" as UserRole,
    companyId: invite.companyId,
  });

  // Create member document
  await db.collection("companies").doc(invite.companyId).collection("members").doc(uid).set({
    userId: uid,
    companyId: invite.companyId,
    email: userEmail,
    displayName: request.auth.token.name || userEmail,
    role: invite.role,
    status: "active",
    invitedBy: invite.invitedBy,
    invitedAt: invite.createdAt,
    joinedAt: FieldValue.serverTimestamp(),
  });

  // Update user profile
  await db.collection("users").doc(uid).set({
    role: "company",
    companyId: invite.companyId,
    profileCompleted: true,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Mark invite as accepted
  await inviteDoc.ref.update({ status: "accepted" });

  return { success: true, companyId: invite.companyId };
});
