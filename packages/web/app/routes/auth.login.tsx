import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Building2, User, Wrench } from "lucide-react";
import Button from "../../components/ui/Button";
import { resetPassword, getEmailVerified, setUserClaims } from "../../lib/auth";
import { updateUserProfile, createCompany, createContractorProfile } from "../../lib/firestore";
import type { AuthContext, UserRole } from "@gemmaham/shared";

const EMAIL_VERIFICATION_REQUIRED = import.meta.env.VITE_EMAIL_VERIFICATION === "true";
const TEST_MODE = !EMAIL_VERIFICATION_REQUIRED;

export default function Login() {
    const { t } = useTranslation();
    const { signIn, signUp, signInWithGoogle, refreshProfile } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [testRole, setTestRole] = useState<UserRole>("user");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetting, setResetting] = useState(false);

    const setupUserRole = async (uid: string, userEmail: string, name: string, role: UserRole) => {
        await updateUserProfile(uid, {
            email: userEmail,
            displayName: name,
            photoURL: null,
            role,
            companyId: null,
            phone: null,
            address: null,
            socialSecurityNumber: null,
            documents: [],
            profileCompleted: false,
        });

        let companyId: string | null = null;
        if (role === "company") {
            companyId = await createCompany({
                name,
                email: userEmail,
                phone: "",
                logo: "",
                description: "",
                address: "",
                ownerId: uid,
            });
            await updateUserProfile(uid, { companyId });
        } else if (role === "contractor") {
            await createContractorProfile(uid, {
                email: userEmail,
                displayName: name,
                companyName: "",
                specialty: "other",
                phone: null,
                description: null,
                logoUrl: null,
                website: null,
            });
        }

        try {
            await setUserClaims(role, companyId ?? undefined);
        } catch {
            // Cloud Function may not be deployed yet
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            if (EMAIL_VERIFICATION_REQUIRED && !getEmailVerified()) {
                navigate("/auth/verify-email");
            } else {
                navigate("/");
            }
        } catch (err: any) {
            // In test mode: auto-create the account if it doesn't exist
            const isNotFound = err.code === "auth/user-not-found" || err.code === "auth/invalid-credential";
            if (TEST_MODE && isNotFound) {
                try {
                    const displayName = email.split("@")[0];
                    const result = await signUp(email, password, displayName);
                    await setupUserRole(result.uid, email, displayName, testRole);
                    await refreshProfile();
                    navigate("/profile/setup");
                } catch (signUpErr: any) {
                    setError(signUpErr.message || "Auto-create failed");
                }
            } else {
                setError(err.message || "Login failed");
            }
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
                    {/* Test mode banner */}
                    {TEST_MODE && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                            <p className="font-medium mb-1">Test mode — any email works</p>
                            <p className="text-xs opacity-70">If the account doesn't exist it will be created automatically.</p>
                        </div>
                    )}

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

                    {/* Role picker — test mode only */}
                    {TEST_MODE && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">{t("auth.iAmA")}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["user", "company", "contractor"] as UserRole[]).map((r) => {
                                    const Icon = r === "user" ? User : r === "company" ? Building2 : Wrench;
                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setTestRole(r)}
                                            className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                                                testRole === r
                                                    ? "border-primary bg-primary/5"
                                                    : "border-foreground/10 hover:border-foreground/20"
                                            }`}
                                        >
                                            <Icon size={16} />
                                            {t(`auth.${r === "user" ? "buyerRenter" : r}`)}
                                        </button>
                                    );
                                })}
                            </div>
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
                                {!TEST_MODE && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={resetting}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        {resetting ? t("common.processing") : t("auth.forgotPassword")}
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none transition-colors"
                                placeholder={t("auth.passwordPlaceholder")}
                                minLength={6}
                                required
                            />
                        </div>

                        <Button fullWidth disabled={loading}>
                            {loading ? t("auth.signingIn") : t("auth.signIn")}
                        </Button>
                    </form>

                    {!TEST_MODE && (
                        <>
                            <div className="my-6 flex items-center gap-3">
                                <div className="flex-1 h-px bg-foreground/10" />
                                <span className="text-sm text-foreground/40">{t("auth.or")}</span>
                                <div className="flex-1 h-px bg-foreground/10" />
                            </div>

                            <Button variant="outline" fullWidth onClick={handleGoogle}>
                                {t("auth.signInWithGoogle")}
                            </Button>
                        </>
                    )}

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
