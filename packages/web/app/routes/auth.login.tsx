import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Box } from "lucide-react";
import Button from "../../components/ui/Button";
import { resetPassword } from "../../lib/auth";
import type { AuthContext } from "@gemmaham/shared";

export default function Login() {
    const { t } = useTranslation();
    const { signIn, signInWithGoogle } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!email) {
            setError(t("auth.resetDesc"));
            return;
        }
        setResetting(true);
        setError(null);
        try {
            await resetPassword(email);
            setResetSent(true);
        } catch {
            setError(t("auth.resetFailed"));
        } finally {
            setResetting(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        try {
            await signInWithGoogle();
            navigate("/");
        } catch (err: any) {
            console.error("Google sign-in error:", err.code, err.message, err);
            setError(`${err.code || "unknown"}: ${err.message || "Google sign-in failed"}`);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <Box className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">Gemmaham</span>
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">{t("auth.welcomeBack")}</h1>
                    <p className="text-foreground/60">{t("auth.signInToAccount")}</p>
                </div>

                <div className="card p-8 bg-surface border-2 border-foreground/10 rounded-xl">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {resetSent && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
                            {t("auth.resetSent")}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t("auth.email")}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none transition-colors"
                                placeholder={t("auth.emailPlaceholder")}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium">{t("auth.password")}</label>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={resetting}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {resetting ? t("common.processing") : t("auth.forgotPassword")}
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none transition-colors"
                                placeholder={t("auth.passwordPlaceholder")}
                                required
                            />
                        </div>

                        <Button fullWidth disabled={loading}>
                            {loading ? t("auth.signingIn") : t("auth.signIn")}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-foreground/10" />
                        <span className="text-sm text-foreground/40">{t("auth.or")}</span>
                        <div className="flex-1 h-px bg-foreground/10" />
                    </div>

                    <Button variant="outline" fullWidth onClick={handleGoogle}>
                        {t("auth.signInWithGoogle")}
                    </Button>

                    <p className="text-center mt-6 text-sm text-foreground/60">
                        {t("auth.noAccount")}{" "}
                        <Link to="/auth/register" className="text-primary font-medium hover:underline">
                            {t("auth.register")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
