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
    if (!conversation.exists) {
      console.error(`Conversation ${conversationId} not found for message ${event.params.messageId}`);
      return;
    }

    const convData = conversation.data()!;
    const senderRole = message.senderRole as "company" | "user" | "contractor";

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

    // Create notification for the recipient
    try {
      let recipientId: string | null = null;
      if (senderRole === "user") {
        // Notify company owner
        const companySnap = await db.collection("companies").doc(convData.companyId).get();
        if (companySnap.exists) {
          recipientId = companySnap.data()!.ownerId;
        }
      } else {
        // Sender is company or contractor — notify the user
        recipientId = convData.userId;
      }

      if (recipientId) {
        const messagePreview = lastMessage.length > 80
          ? lastMessage.substring(0, 80) + "..."
          : lastMessage;

        await db
          .collection("users")
          .doc(recipientId)
          .collection("notifications")
          .add({
            userId: recipientId,
            type: "new_message",
            title: "New message",
            message: messagePreview,
            linkTo: `/conversations/${conversationId}`,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error("Failed to create message notification:", error);
    }
  }
);
