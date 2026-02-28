import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { UserRole } from "@gemmaham/shared";

export const setUserClaims = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const { role, companyId } = request.data as {
    role: UserRole;
    companyId?: string;
  };

  if (role !== "company" && role !== "user" && role !== "contractor") {
    throw new HttpsError("invalid-argument", "Role must be 'company', 'user', or 'contractor'");
  }

  const uid = request.auth.uid;
  const db = getFirestore();

  // Prevent role changes — only allow setting role if user has no role yet
  const existingClaims = (await getAuth().getUser(uid)).customClaims;
  if (existingClaims?.role) {
    throw new HttpsError(
      "permission-denied",
      "Role already set. Contact support to change roles."
    );
  }

  let resolvedCompanyId: string | null = null;

  if (role === "company") {
    if (companyId) {
      // Verify the company exists and the caller is the owner
      const companyDoc = await db.collection("companies").doc(companyId).get();
      if (!companyDoc.exists) {
        throw new HttpsError("not-found", "Company not found");
      }
      const companyData = companyDoc.data();
      if (companyData?.ownerId !== uid) {
        throw new HttpsError("permission-denied", "You are not the owner of this company");
      }
      resolvedCompanyId = companyId;
    }
    // If no companyId, company will be created by the frontend after claims are set
  }

  // Set custom claims
  await getAuth().setCustomUserClaims(uid, {
    role,
    companyId: resolvedCompanyId,
  });

  // Update user profile
  await db.collection("users").doc(uid).set(
    {
      role,
      companyId: resolvedCompanyId,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { success: true, role, companyId: resolvedCompanyId };
});
