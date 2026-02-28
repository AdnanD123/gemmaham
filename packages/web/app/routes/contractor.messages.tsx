import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import ContractorSidebar from "../../components/ContractorSidebar";
import RoleGuard from "../../components/RoleGuard";
import ConversationList from "../../components/ConversationList";
import { ConversationListSkeleton } from "../../components/skeletons/MessageSkeleton";
import { getUserConversations } from "../../lib/firestore";
import type { AuthContext, Conversation } from "@gemmaham/shared";

export default function ContractorMessages() {
    const auth = useOutletContext<AuthContext>();
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.user) return;
        setLoading(true);
        const unsubscribe = getUserConversations(auth.user.uid, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return unsubscribe;
    }, [auth.user]);

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <ContractorSidebar />
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("contractor.messages")}</h1>

                        {loading ? (
                            <ConversationListSkeleton />
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                role="user"
                                basePath="/contractor/messages"
                            />
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
