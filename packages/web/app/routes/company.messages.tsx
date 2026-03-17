import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import RoleGuard from "../../components/RoleGuard";
import ConversationList from "../../components/ConversationList";
import { ConversationListSkeleton } from "../../components/skeletons/MessageSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getCompanyConversations } from "../../lib/firestore";
import type { AuthContext, Conversation } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

type MessageTab = "buyers" | "contractors";

export default function CompanyMessages() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<MessageTab>("buyers");

    useEffect(() => {
        if (!auth.companyId) return;
        setLoading(true);
        const unsubscribe = getCompanyConversations(auth.companyId, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return unsubscribe;
    }, [auth.companyId]);

    const buyerConversations = useMemo(
        () => conversations.filter((c) => c.flatId || c.houseId),
        [conversations],
    );

    const contractorConversations = useMemo(
        () => conversations.filter((c) => c.buildingId && !c.flatId && !c.houseId),
        [conversations],
    );

    const filteredConversations = activeTab === "buyers" ? buyerConversations : contractorConversations;

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("company.messagesTitle")}</h1>

                        <div className="flex gap-1 mb-6 p-1 bg-foreground/4 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab("buyers")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    activeTab === "buyers"
                                        ? "bg-surface text-foreground shadow-sm"
                                        : "text-foreground/50 hover:text-foreground/70"
                                }`}
                            >
                                {t("messages.buyers")}
                                {buyerConversations.length > 0 && (
                                    <span className="ml-2 text-xs text-foreground/40">
                                        {buyerConversations.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("contractors")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    activeTab === "contractors"
                                        ? "bg-surface text-foreground shadow-sm"
                                        : "text-foreground/50 hover:text-foreground/70"
                                }`}
                            >
                                {t("messages.contractors")}
                                {contractorConversations.length > 0 && (
                                    <span className="ml-2 text-xs text-foreground/40">
                                        {contractorConversations.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <ContentLoader loading={loading} skeleton={<ConversationListSkeleton />}>
                            <ConversationList
                                conversations={filteredConversations}
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
