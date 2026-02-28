import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { useNotifications } from "../lib/hooks/useNotifications";
import type { UserNotification } from "@gemmaham/shared";

function timeAgo(dateStr: string | { seconds: number }): string {
    const date = typeof dateStr === "object" && "seconds" in dateStr
        ? new Date(dateStr.seconds * 1000)
        : new Date(dateStr as string);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

interface NotificationBellProps {
    userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
    const { t } = useTranslation();
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(userId);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleNotificationClick = async (notification: UserNotification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label={unreadCount > 0 ? `${t("notifications.title")} (${unreadCount})` : t("notifications.title")}
                aria-expanded={open}
                aria-haspopup="true"
                className="relative p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-80 bg-surface border-2 border-foreground/10 rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
                        <span className="text-sm font-semibold">{t("notifications.title")}</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={14} />
                                {t("notifications.markAllRead")}
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-foreground/40 text-sm">
                                {t("notifications.empty")}
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((n) => (
                                <div key={n.id}>
                                    {n.linkTo ? (
                                        <Link
                                            to={n.linkTo}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`block px-4 py-3 hover:bg-foreground/5 transition-colors border-b border-foreground/5 ${!n.read ? "bg-primary/5" : ""}`}
                                        >
                                            <NotificationContent notification={n} />
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleNotificationClick(n)}
                                            className={`block w-full text-left px-4 py-3 hover:bg-foreground/5 transition-colors border-b border-foreground/5 ${!n.read ? "bg-primary/5" : ""}`}
                                        >
                                            <NotificationContent notification={n} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function NotificationContent({ notification }: { notification: UserNotification }) {
    return (
        <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${!notification.read ? "font-medium" : "text-foreground/70"}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-foreground/50 mt-0.5 line-clamp-2">
                    {notification.message}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-foreground/40">
                    {timeAgo(notification.createdAt as string)}
                </span>
                {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                )}
            </div>
        </div>
    );
}

export default NotificationBell;
