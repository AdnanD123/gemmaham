import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Building2, User, Wrench } from "lucide-react";
import Button from "../../components/ui/Button";
import { PageTransition } from "../../components/ui/PageTransition";
import { updateUserProfile, createCompany, createContractorProfile } from "../../lib/firestore";
import { setUserClaims, sendEmailVerification } from "../../lib/auth";
import { registerSchema } from "../../lib/validation";
import { useFormValidation } from "../../lib/hooks/useFormValidation";

const EMAIL_VERIFICATION_REQUIRED = import.meta.env.VITE_EMAIL_VERIFICATION === "true";
import type { AuthContext, UserRole } from "@gemmaham/shared";

export default function Register() {
    const { t } = useTranslation();
    const { signUp, signInWithGoogle, refreshProfile } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<UserRole>("user");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { errors: fieldErrors, validate, clearError } = useFormValidation(registerSchema);

    const setupUserRole = async (uid: string, userEmail: string, name: string) => {
        // 1. Write user profile with role first (Firestore rules use this as fallback)
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

        // 2. Role-specific setup
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

        // 3. Try to set custom claims (works when Cloud Functions are deployed)
        try {
            await setUserClaims(role, companyId ?? undefined);
        } catch {
            // Cloud Function may not be deployed yet — rules fallback to Firestore profile
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validate({ displayName, email, password, role })) return;

        setLoading(true);

        try {
            const result = await signUp(email, password, displayName);
            await setupUserRole(result.uid, email, displayName);
            await refreshProfile();

            if (EMAIL_VERIFICATION_REQUIRED && !result.emailVerified) {
                await sendEmailVerification();
                navigate("/auth/verify-email");
            } else {
                navigate("/profile/setup");
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        try {
            const result = await signInWithGoogle();
            await setupUserRole(
                result.uid,
                result.email || "",
                result.displayName || "User",
            );
            await refreshProfile();

            navigate("/profile/setup");
        } catch (err: any) {
            console.error("Google sign-in error:", err.code, err.message, err);
            setError(err.message || "Google sign-in failed");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <PageTransition className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <Box className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">Gemmaham</span>
                    </Link>
                    <h1 className="text-3xl font-serif font-bold mb-2">{t("auth.createAccount")}</h1>
                    <p className="text-foreground/60">{t("auth.joinGemmaham")}</p>
                </div>

                <div className="card p-8 bg-surface border border-foreground/6 rounded-2xl shadow-elevated">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Role selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">{t("auth.iAmA")}</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("user")}
                                className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                                    role === "user"
                                        ? "border-primary bg-primary/5"
                                        : "border-foreground/6 hover:border-foreground/20"
                                }`}
                            >
                                <User className="w-6 h-6" />
                                <span className="text-sm font-medium">{t("auth.buyerRenter")}</span>
                                <span className="text-xs text-foreground/50">{t("auth.browseReserve")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("company")}
                                className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                                    role === "company"
                                        ? "border-primary bg-primary/5"
                                        : "border-foreground/6 hover:border-foreground/20"
                                }`}
                            >
                                <Building2 className="w-6 h-6" />
                                <span className="text-sm font-medium">{t("auth.company")}</span>
                                <span className="text-xs text-foreground/50">{t("auth.listManage")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("contractor")}
                                className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                                    role === "contractor"
                                        ? "border-primary bg-primary/5"
                                        : "border-foreground/6 hover:border-foreground/20"
                                }`}
                            >
                                <Wrench className="w-6 h-6" />
                                <span className="text-sm font-medium">{t("auth.contractor")}</span>
                                <span className="text-xs text-foreground/50">{t("auth.manageProjects")}</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t("auth.fullName")}
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => { setDisplayName(e.target.value); clearError("displayName"); }}
                                className={`w-full px-4 py-3 border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none transition-colors ${fieldErrors.displayName ? "border-red-400" : ""}`}
                                placeholder={t("auth.fullNamePlaceholder")}
                                required
                            />
                            {fieldErrors.displayName && <p className="text-sm text-red-500 mt-1">{t(fieldErrors.displayName)}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">{t("auth.email")}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                                className={`w-full px-4 py-3 border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none transition-colors ${fieldErrors.email ? "border-red-400" : ""}`}
                                placeholder={t("auth.emailPlaceholder")}
                                required
                            />
                            {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{t(fieldErrors.email)}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">{t("auth.password")}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                                className={`w-full px-4 py-3 border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none transition-colors ${fieldErrors.password ? "border-red-400" : ""}`}
                                placeholder={t("auth.passwordHint")}
                                minLength={6}
                                required
                            />
                            {fieldErrors.password && <p className="text-sm text-red-500 mt-1">{t(fieldErrors.password)}</p>}
                        </div>

                        <Button fullWidth disabled={loading}>
                            {loading ? t("auth.creatingAccount") : t("auth.createAccountBtn")}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-foreground/6" />
                        <span className="text-sm text-foreground/40">{t("auth.or")}</span>
                        <div className="flex-1 h-px bg-foreground/6" />
                    </div>

                    <Button variant="outline" fullWidth onClick={handleGoogle}>
                        {t("auth.signUpWithGoogle")}
                    </Button>

                    <p className="text-center mt-6 text-sm text-foreground/60">
                        {t("auth.haveAccount")}{" "}
                        <Link to="/auth/login" className="text-primary font-medium hover:underline">
                            {t("auth.signIn")}
                        </Link>
                    </p>
                </div>
            </PageTransition>
        </div>
    );
}
