import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import type { Message } from "@gemmaham/shared";

interface Props {
    messages: Message[];
    currentUserId: string;
    partnerName?: string;
}

const MessageThread = ({ messages, currentUserId, partnerName }: Props) => {
    const { t } = useTranslation();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageSquare size={28} className="text-primary" />
                    </div>
                    {partnerName ? (
                        <>
                            <h2 className="text-2xl font-bold mb-2">
                                {t("messages.startConversationWith", { name: partnerName })}
                            </h2>
                            <p className="text-foreground/50 text-sm">
                                {t("messages.startConversationHint")}
                            </p>
                        </>
                    ) : (
                        <p className="text-foreground/40">{t("messages.noMessages")}</p>
                    )}
                </div>
            )}
            {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                const time = msg.timestamp instanceof Date
                    ? msg.timestamp
                    : new Date((msg.timestamp as any)?.seconds * 1000 || Date.now());

                // Card-type message
                if (msg.type === "card" && msg.cardData) {
                    const hasText = msg.content && msg.content !== msg.cardData.title;
                    return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[75%] space-y-1.5">
                                {/* Clickable property card */}
                                <Link
                                    to={msg.cardData.linkType === "building"
                                        ? `/buildings/${msg.cardData.linkId}`
                                        : `/flats/${msg.cardData.linkId}`}
                                    className="block group"
                                >
                                    <div className="rounded-2xl border-2 border-foreground/10 overflow-hidden hover:border-primary/40 transition-colors bg-surface">
                                        {msg.cardData.imageUrl && (
                                            <img src={msg.cardData.imageUrl} alt="" className="w-full h-32 object-cover" />
                                        )}
                                        <div className="p-3">
                                            <p className="font-medium text-sm group-hover:text-primary">{msg.cardData.title}</p>
                                            {msg.cardData.subtitle && (
                                                <p className="text-xs text-foreground/50 mt-0.5">{msg.cardData.subtitle}</p>
                                            )}
                                            <p className="text-xs text-primary mt-2">{t("messages.viewProperty")} &rarr;</p>
                                        </div>
                                    </div>
                                </Link>
                                {/* User's text message below the card */}
                                {hasText && (
                                    <div className={`px-4 py-2.5 rounded-2xl ${
                                        isMine
                                            ? "bg-primary text-white rounded-br-md"
                                            : "bg-surface-highlight text-foreground rounded-bl-md"
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                )}
                                <p className={`text-[10px] ${isMine ? "text-right text-foreground/30" : "text-foreground/30"}`}>
                                    {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    );
                }

                // Text message (default)
                return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                            isMine
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-surface-highlight text-foreground rounded-bl-md"
                        }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-foreground/30"}`}>
                                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default MessageThread;
