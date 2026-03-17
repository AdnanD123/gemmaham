import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import AuthGuard from "../../components/AuthGuard";
import ConversationList from "../../components/ConversationList";
import { ConversationListSkeleton } from "../../components/skeletons/MessageSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getUserConversations } from "../../lib/firestore";
import type { AuthContext, Conversation } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function UserMessages() {
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
        <AuthGuard>
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("user.myMessages")}</h1>

                        <ContentLoader loading={loading} skeleton={<ConversationListSkeleton />}>
                            <ConversationList
                                conversations={conversations}
                                role="user"
                                basePath="/user/messages"
                            />
                        </ContentLoader>
                    </main>
                </div>
            </div>
            </PageTransition>
        </AuthGuard>
    );
}
