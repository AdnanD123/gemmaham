import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import MessageThread from "../../components/MessageThread";
import MessageInput from "../../components/MessageInput";
import { useMessages } from "../../lib/hooks/useMessages";
import { getConversation } from "../../lib/firestore";
import { MessageThreadSkeleton } from "../../components/skeletons/MessageSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import type { AuthContext, Conversation, MessageCardData } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function UserConversation() {
    const { conversationId } = useParams();
    const auth = useOutletContext<AuthContext>();
    const { t } = useTranslation();
    const location = useLocation();
    const { messages, loading, send } = useMessages(
        conversationId || null,
        auth.user?.uid || null,
        auth.role,
    );
    const [conv, setConv] = useState<Conversation | null>(null);
    const [attachedCard, setAttachedCard] = useState<MessageCardData | null>(
        (location.state as any)?.cardData || null,
    );

    useEffect(() => {
        if (!conversationId) return;
        getConversation(conversationId).then(setConv);
    }, [conversationId]);

    return (
        <AuthGuard>
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 flex flex-col h-[calc(100vh-80px)]">
                        <div className="p-4 border-b-2 border-foreground/5">
                            <Link to="/user/messages" className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground">
                                <ArrowLeft size={16} /> {t("user.backToMessages")}
                            </Link>
                            {conv && (
                                <div className="mt-2">
                                    <h2 className="font-bold text-lg">{conv.companyName}</h2>
                                    <p className="text-xs text-foreground/50">Re: {conv.flatTitle}</p>
                                </div>
                            )}
                        </div>

                        <ContentLoader loading={loading} skeleton={<div className="flex-1"><MessageThreadSkeleton /></div>}>
                            <MessageThread messages={messages} currentUserId={auth.user?.uid || ""} partnerName={conv?.companyName} />
                        </ContentLoader>

                        <MessageInput
                            onSend={send}
                            disabled={!auth.user}
                            attachedCard={attachedCard}
                            onRemoveCard={() => setAttachedCard(null)}
                        />
                    </main>
                </div>
            </div>
            </PageTransition>
        </AuthGuard>
    );
}
