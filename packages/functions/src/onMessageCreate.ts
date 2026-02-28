import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const onMessageCreate = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const message = snapshot.data();
    const conversationId = event.params.conversationId;
    const db = getFirestore();

    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversation = await conversationRef.get();
    if (!conversation.exists) return;

    const convData = conversation.data()!;
    const senderRole = message.senderRole as "company" | "user";

    // Update conversation metadata
    const lastMessage = message.type === "card" && message.cardData?.title
      ? message.cardData.title.substring(0, 100)
      : message.content.substring(0, 100);
    const updateData: Record<string, any> = {
      lastMessage,
      lastMessageAt: message.timestamp,
      lastMessageSenderId: message.senderId,
    };

    // Increment unread count for the other party
    if (senderRole === "user") {
      updateData.companyUnreadCount = FieldValue.increment(1);
    } else {
      updateData.userUnreadCount = FieldValue.increment(1);
    }

    await conversationRef.update(updateData);
  }
);
