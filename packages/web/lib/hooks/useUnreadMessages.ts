import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Conversation } from "@gemmaham/shared";

interface UseUnreadMessagesResult {
  unreadCount: number;
  loading: boolean;
}

export function useUnreadMessages(
  userId: string | undefined,
  role: string | undefined,
  companyId?: string | null,
): UseUnreadMessagesResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !companyId) {
      setLoading(false);
      setUnreadCount(0);
      return;
    }

    const isCompany = role === "company";

    const q = isCompany
      ? query(
          collection(db, "conversations"),
          where("companyId", "==", companyId),
        )
      : query(
          collection(db, "conversations"),
          where("userId", "==", userId),
        );

    const unsubscribe = onSnapshot(q, (snap) => {
      let total = 0;
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Conversation;
        if (isCompany) {
          total += data.companyUnreadCount || 0;
        } else {
          total += data.userUnreadCount || 0;
        }
      }
      setUnreadCount(total);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, role, companyId]);

  return { unreadCount, loading };
}
