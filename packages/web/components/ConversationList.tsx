import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Conversation, UserRole } from "@gemmaham/shared";

interface Props {
    conversations: Conversation[];
    role: UserRole;
    basePath: string;
}

const ConversationList = ({ conversations, role, basePath }: Props) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-2">
            {conversations.length === 0 && (
                <p className="text-center py-8 text-foreground/40">{t("messages.noConversations")}</p>
            )}
            {conversations.map((conv) => {
                const unread = role === "user" ? conv.userUnreadCount : conv.companyUnreadCount;
                const otherName = role === "user" ? conv.companyName : conv.userName;
                const lastTime = conv.lastMessageAt instanceof Date
                    ? conv.lastMessageAt
                    : new Date((conv.lastMessageAt as any)?.seconds * 1000 || Date.now());

                return (
                    <Link
                        key={conv.id}
                        to={`${basePath}/${conv.id}`}
                        className="block p-4 bg-surface rounded-xl border-2 border-foreground/10 hover:border-primary/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium truncate">{otherName}</h3>
                                    {unread > 0 && (
                                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
                                    )}
                                </div>
                                <p className="text-xs text-foreground/40 mt-0.5">Re: {conv.flatTitle}</p>
                                {conv.lastMessage && (
                                    <p className="text-sm text-foreground/50 truncate mt-1">{conv.lastMessage}</p>
                                )}
                            </div>
                            <span className="text-xs text-foreground/30 shrink-0">
                                {lastTime.toLocaleDateString()}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default ConversationList;
