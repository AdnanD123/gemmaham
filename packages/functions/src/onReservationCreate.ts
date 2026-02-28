import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const onReservationCreate = onDocumentCreated(
  "reservations/{reservationId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const db = getFirestore();

    // Calculate queue position and set expiry atomically
    await db.runTransaction(async (txn) => {
      const activeRequests = await db
        .collection("reservations")
        .where("flatId", "==", data.flatId)
        .where("status", "in", ["requested", "approved", "reserved"])
        .get();

      const queuePosition = activeRequests.size;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      txn.update(snap.ref, {
        queuePosition,
        expiresAt: expiresAt.toISOString(),
      });
    });

    // Create notification for the company owner (outside transaction — non-critical)
    const companySnap = await db.collection("companies").doc(data.companyId).get();
    if (companySnap.exists) {
      const companyData = companySnap.data()!;

      const flatSnap = await db.collection("flats").doc(data.flatId).get();
      const flatTitle = flatSnap.exists ? flatSnap.data()!.title : data.flatId;

      await db
        .collection("users")
        .doc(companyData.ownerId)
        .collection("notifications")
        .add({
          userId: companyData.ownerId,
          type: "new_request",
          title: "New reservation request",
          message: `${data.userSnapshot?.displayName || "A user"} requested ${flatTitle}`,
          linkTo: "/company/reservations",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
    }
  },
);
