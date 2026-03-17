import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CalendarCheck,
  Clock,
  CheckCheck,
  FileText,
  Hammer,
  Inbox,
  MessageSquare,
  UserCheck,
  UserX,
  ArrowLeft,
} from "lucide-react";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { PageTransition } from "../../components/ui/PageTransition";
import type { AuthContext, NotificationType, UserNotification } from "@gemmaham/shared";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "reservation_status":
      return <FileText size={18} className="text-blue-500" />;
    case "meeting_scheduled":
      return <CalendarCheck size={18} className="text-green-500" />;
    case "reservation_expiring":
      return <Clock size={18} className="text-amber-500" />;
    case "customization_status":
      return <MessageSquare size={18} className="text-purple-500" />;
    case "new_request":
      return <Inbox size={18} className="text-primary" />;
    case "contractor_assigned":
      return <Hammer size={18} className="text-teal-500" />;
    case "application_received":
      return <Inbox size={18} className="text-blue-500" />;
    case "application_accepted":
      return <UserCheck size={18} className="text-green-500" />;
    case "application_rejected":
      return <UserX size={18} className="text-red-500" />;
    default:
      return <Bell size={18} className="text-foreground/50" />;
  }
}

function formatTime(dateStr: string | { seconds: number }): string {
  const date =
    typeof dateStr === "object" && "seconds" in dateStr
      ? new Date(dateStr.seconds * 1000)
      : new Date(dateStr as string);
  return formatDistanceToNow(date, { addSuffix: true });
}

function NotificationItem({
  notification,
  onRead,
  onNavigate,
}: {
  notification: UserNotification;
  onRead: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
    if (notification.linkTo) {
      onNavigate(notification.linkTo);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-foreground/5 hover:bg-foreground/5 transition-colors ${
        !notification.read ? "bg-primary/5" : ""
      } ${notification.linkTo ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            !notification.read ? "font-semibold text-foreground" : "text-foreground/70"
          }`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-foreground/50 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-foreground/40 mt-1">
          {formatTime(notification.createdAt as string)}
        </p>
      </div>
      {!notification.read && (
        <span className="shrink-0 mt-2 w-2.5 h-2.5 rounded-full bg-primary" />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const auth = useOutletContext<AuthContext>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!auth.user && !auth.loading) {
    if (typeof window !== "undefined") {
      navigate("/auth/login", { replace: true });
    }
    return null;
  }

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(
    auth.user?.uid ?? null,
  );

  if (auth.loading) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-foreground/10 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-foreground/5 rounded-xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTransition className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label={t("common.back")}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{t("notifications.allNotifications")}</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-foreground/50">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
            >
              <CheckCheck size={16} />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="bg-surface border border-foreground/6 rounded-2xl shadow-card overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                <Bell size={28} className="text-foreground/30" />
              </div>
              <p className="text-lg font-medium text-foreground/60">
                {t("notifications.noNotifications")}
              </p>
              <p className="text-sm text-foreground/40 mt-1 text-center max-w-xs">
                {t("notifications.noNotificationsDesc")}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onNavigate={(path) => navigate(path)}
              />
            ))
          )}
        </div>
      </PageTransition>
    </>
  );
}
