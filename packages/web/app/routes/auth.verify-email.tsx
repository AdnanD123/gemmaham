import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Mail, RefreshCw } from "lucide-react";
import Button from "../../components/ui/Button";
import { sendEmailVerification, reloadUser, getEmailVerified } from "../../lib/auth";
import type { AuthContext } from "@gemmaham/shared";

export default function VerifyEmail() {
    const { t } = useTranslation();
    const { user } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/auth/login", { replace: true });
            return;
        }

        // Poll every 3 seconds to check if the user has verified their email
        const interval = setInterval(async () => {
            await reloadUser();
            if (getEmailVerified()) {
                clearInterval(interval);
                navigate("/profile/setup", { replace: true });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user, navigate]);

    const handleResend = async () => {
        setSending(true);
        setSent(false);
        try {
            await sendEmailVerification();
            setSent(true);
        } catch (e) {
            console.error("Failed to resend verification email:", e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div className="inline-flex items-center gap-2 mb-8">
                    <Box className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold">Gemmaham</span>
                </div>

                <div className="bg-surface border-2 border-foreground/10 rounded-xl p-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{t("auth.verifyEmail")}</h1>
                    <p className="text-foreground/60 mb-6">
                        {t("auth.verifyEmailDesc", { email: user?.email ?? "" })}
                    </p>

                    {sent && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                            {t("auth.verifyEmailResent")}
                        </div>
                    )}

                    <Button
                        fullWidth
                        variant="outline"
                        onClick={handleResend}
                        disabled={sending}
                    >
                        <RefreshCw size={16} className={`mr-2 ${sending ? "animate-spin" : ""}`} />
                        {sending ? t("common.processing") : t("auth.verifyEmailResend")}
                    </Button>

                    <p className="mt-4 text-xs text-foreground/40">
                        {t("auth.verifyEmailNote")}
                    </p>
                </div>
            </div>
        </div>
    );
}
