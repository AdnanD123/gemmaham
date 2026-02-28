import { useEffect, useState, useCallback } from "react";
import { subscribeToMessages, sendMessage, markMessagesAsRead } from "../firestore";
import type { Message, MessageCardData, UserRole } from "@gemmaham/shared";

export function useMessages(conversationId: string | null, currentUserId: string | null, currentRole: UserRole | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);

      // Mark messages as read
      if (currentRole) {
        markMessagesAsRead(conversationId, currentRole);
      }
    });

    return unsubscribe;
  }, [conversationId, currentRole]);

  const send = useCallback(
    async (content: string, cardData?: MessageCardData) => {
      if (!conversationId || !currentUserId || !currentRole) return;
      if (cardData) {
        await sendMessage(conversationId, {
          senderId: currentUserId,
          senderRole: currentRole,
          content,
          type: "card",
          cardData,
        });
      } else {
        await sendMessage(conversationId, {
          senderId: currentUserId,
          senderRole: currentRole,
          content,
        });
      }
    },
    [conversationId, currentUserId, currentRole],
  );

  return { messages, loading, send };
}
