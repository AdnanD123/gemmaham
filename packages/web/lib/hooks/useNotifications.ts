import { useState, useEffect, useMemo, useCallback } from "react";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../firestore";
import type { UserNotification } from "@gemmaham/shared";

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
    });

    return unsubscribe;
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    await markNotificationAsRead(userId, notificationId);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
  }, [userId]);

  return { notifications, unreadCount, markAsRead, markAllRead };
}
