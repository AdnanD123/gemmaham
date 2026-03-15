import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import ConversationList from "../../components/ConversationList";
import { ConversationListSkeleton } from "../../components/skeletons/MessageSkeleton";
import { getCompanyConversations } from "../../lib/firestore";
import type { AuthContext, Conversation } from "@gemmaham/shared";

export default function CompanyMessages() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.companyId) return;
        setLoading(true);
        const unsubscribe = getCompanyConversations(auth.companyId, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return unsubscribe;
    }, [auth.companyId]);

    return (
        <RoleGuard allowedRole="company">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("company.messagesTitle")}</h1>

                        {loading ? (
                            <ConversationListSkeleton />
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                role="company"
                                basePath="/company/messages"
                            />
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
