import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const expireReservations = onSchedule(
  { schedule: "every 24 hours", timeZone: "UTC" },
  async () => {
    const db = getFirestore();
    const now = new Date().toISOString();

    // Find all requested reservations past their expiry
    const expired = await db
      .collection("reservations")
      .where("status", "==", "requested")
      .where("expiresAt", "<=", now)
      .get();

    if (expired.empty) return;

    for (const doc of expired.docs) {
      const data = doc.data();
      const history = data.statusHistory || [];
      history.push({
        from: "requested",
        to: "expired",
        changedAt: new Date().toISOString(),
        reason: "No agency action for 14 days",
      });

      await doc.ref.update({
        status: "expired",
        statusHistory: history,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get flat title for notification
      const flatSnap = await db.collection("flats").doc(data.flatId).get();
      const flatTitle = flatSnap.exists ? flatSnap.data()!.title : data.flatId;

      // Notify user
      await db
        .collection("users")
        .doc(data.userId)
        .collection("notifications")
        .add({
          userId: data.userId,
          type: "reservation_expiring",
          title: "Reservation request expired",
          message: `Your reservation request for ${flatTitle} has expired after 14 days without agency response.`,
          linkTo: "/user/reservations",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
    }

    console.log(`Expired ${expired.size} reservation(s)`);
  },
);
