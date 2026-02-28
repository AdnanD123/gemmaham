import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import ContractorSidebar from "../../components/ContractorSidebar";
import RoleGuard from "../../components/RoleGuard";
import MessageThread from "../../components/MessageThread";
import MessageInput from "../../components/MessageInput";
import { useMessages } from "../../lib/hooks/useMessages";
import { getConversation } from "../../lib/firestore";
import { MessageThreadSkeleton } from "../../components/skeletons/MessageSkeleton";
import type { AuthContext, Conversation, MessageCardData } from "@gemmaham/shared";

export default function ContractorConversation() {
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
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <ContractorSidebar />
                    <main className="flex-1 flex flex-col h-[calc(100vh-80px)]">
                        <div className="p-4 border-b-2 border-foreground/5">
                            <Link to="/contractor/messages" className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground">
                                <ArrowLeft size={16} /> {t("contractor.backToMessages")}
                            </Link>
                            {conv && (
                                <div className="mt-2">
                                    <h2 className="font-bold text-lg">{conv.companyName}</h2>
                                    <p className="text-xs text-foreground/50">Re: {conv.flatTitle}</p>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex-1"><MessageThreadSkeleton /></div>
                        ) : (
                            <MessageThread messages={messages} currentUserId={auth.user?.uid || ""} partnerName={conv?.companyName} />
                        )}

                        <MessageInput
                            onSend={send}
                            disabled={!auth.user}
                            attachedCard={attachedCard}
                            onRemoveCard={() => setAttachedCard(null)}
                        />
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
