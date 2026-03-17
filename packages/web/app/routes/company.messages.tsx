import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import RoleGuard from "../../components/RoleGuard";
import ConversationList from "../../components/ConversationList";
import { ConversationListSkeleton } from "../../components/skeletons/MessageSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getCompanyConversations } from "../../lib/firestore";
import type { AuthContext, Conversation } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

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
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("company.messagesTitle")}</h1>

                        <ContentLoader loading={loading} skeleton={<ConversationListSkeleton />}>
                            <ConversationList
                                conversations={conversations}
                                role="company"
                                basePath="/company/messages"
                            />
                        </ContentLoader>
                    </main>
                </div>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
