import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, X } from "lucide-react";
import type { MessageCardData } from "@gemmaham/shared";

interface Props {
    onSend: (content: string, cardData?: MessageCardData) => void;
    disabled?: boolean;
    attachedCard?: MessageCardData | null;
    onRemoveCard?: () => void;
}

const MessageInput = ({ onSend, disabled, attachedCard, onRemoveCard }: Props) => {
    const { t } = useTranslation();
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [text]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = text.trim();
        if (!trimmed && !attachedCard) return;
        onSend(trimmed || attachedCard?.title || "", attachedCard || undefined);
        setText("");
        onRemoveCard?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-foreground/6 bg-background sticky bottom-0 z-10">
            {/* Attached card preview */}
            {attachedCard && (
                <div className="px-4 pt-3">
                    <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-foreground/6">
                        {attachedCard.imageUrl && (
                            <img
                                src={attachedCard.imageUrl}
                                alt=""
                                className="w-16 h-16 rounded-lg object-cover shrink-0"
                                loading="lazy"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{attachedCard.title}</p>
                            {attachedCard.subtitle && (
                                <p className="text-xs text-foreground/50 truncate">{attachedCard.subtitle}</p>
                            )}
                            <p className="text-xs text-primary mt-0.5">
                                {attachedCard.linkType === "building" ? "Building" : "Flat"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onRemoveCard}
                            className="p-1 text-foreground/30 hover:text-foreground/60 transition-colors shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Text input */}
            <div className="flex items-end gap-2 p-4">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={attachedCard ? t("messages.addMessagePlaceholder") : t("messages.typePlaceholder")}
                    disabled={disabled}
                    className="flex-1 px-4 py-2.5 border border-foreground/6 rounded-2xl bg-background focus:border-primary focus:outline-none text-sm resize-none"
                />
                <button
                    type="submit"
                    disabled={disabled || (!text.trim() && !attachedCard)}
                    aria-label="Send message"
                    className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </form>
    );
};

export default MessageInput;
