import { beforeUserCreated, type AuthBlockingEvent } from "firebase-functions/v2/identity";
import { getFirestore } from "firebase-admin/firestore";

export const onUserCreate: ReturnType<typeof beforeUserCreated> = beforeUserCreated(async (event: AuthBlockingEvent) => {
  const user = event.data!;
  const db = getFirestore();

  await db.collection("users").doc(user.uid).set({
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    role: null, // Set later via setUserClaims
    companyId: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});
