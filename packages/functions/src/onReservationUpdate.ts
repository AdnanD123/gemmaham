import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const onReservationUpdate = onDocumentUpdated(
  "reservations/{reservationId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only act on status changes
    if (before.status === after.status) return;

    const db = getFirestore();
    const newStatus = after.status;

    // Get flat title for notifications
    const flatSnap = await db.collection("flats").doc(after.flatId).get();
    const flatTitle = flatSnap.exists ? flatSnap.data()!.title : after.flatId;

    // Auto-lock flat when status → "reserved"
    if (newStatus === "reserved") {
      // Collect notification targets during the transaction
      const rejectedUsers: { userId: string }[] = [];

      await db.runTransaction(async (txn) => {
        // Read all other active requests first (reads before writes in transactions)
        const otherRequests = await db
          .collection("reservations")
          .where("flatId", "==", after.flatId)
          .where("status", "in", ["requested", "approved"])
          .get();

        // Update flat status to "reserved"
        const flatRef = db.collection("flats").doc(after.flatId);
        txn.update(flatRef, {
          status: "reserved",
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Reject all competing requests
        for (const doc of otherRequests.docs) {
          if (doc.id === event.params.reservationId) continue;
          const docData = doc.data();
          const history = docData.statusHistory || [];
          history.push({
            from: docData.status,
            to: "rejected",
            changedAt: new Date().toISOString(),
            reason: "Another buyer was selected",
          });

          txn.update(doc.ref, {
            status: "rejected",
            rejectionReason: "Another buyer was selected",
            statusHistory: history,
            updatedAt: FieldValue.serverTimestamp(),
          });

          rejectedUsers.push({ userId: docData.userId });
        }
      });

      // Send rejection notifications outside the transaction (idempotent)
      for (const target of rejectedUsers) {
        await db
          .collection("users")
          .doc(target.userId)
          .collection("notifications")
          .add({
            userId: target.userId,
            type: "reservation_status",
            title: "Reservation request rejected",
            message: `Your request for ${flatTitle} was not selected. Another buyer was chosen.`,
            linkTo: "/user/reservations",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
      }
    }

    // Update flat status when completed → "sold" (atomic)
    if (newStatus === "completed") {
      await db.runTransaction(async (txn) => {
        txn.update(db.collection("flats").doc(after.flatId), {
          status: "sold",
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    }

    // Revert flat status when reserved → cancelled (atomic)
    if (before.status === "reserved" && newStatus === "cancelled") {
      await db.runTransaction(async (txn) => {
        txn.update(db.collection("flats").doc(after.flatId), {
          status: "available",
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    }

    // Notify user on every status change
    const statusMessages: Record<string, string> = {
      approved: `Your reservation request for ${flatTitle} has been approved!`,
      reserved: `${flatTitle} is now reserved for you. Congratulations!`,
      completed: `The sale of ${flatTitle} is complete. Welcome home!`,
      rejected: `Your reservation request for ${flatTitle} was declined.`,
      cancelled: `Your reservation for ${flatTitle} has been cancelled.`,
    };

    if (statusMessages[newStatus]) {
      await db
        .collection("users")
        .doc(after.userId)
        .collection("notifications")
        .add({
          userId: after.userId,
          type: "reservation_status",
          title: `Reservation ${newStatus}`,
          message: statusMessages[newStatus],
          linkTo: "/user/reservations",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
    }
  },
);
