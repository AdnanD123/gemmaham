import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Camera, Lock, Mail, KeyRound } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getUserProfile, updateUserProfile } from "../../lib/firestore";
import { uploadProfilePhoto } from "../../lib/storage";
import { resetPassword } from "../../lib/auth";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, UserProfile } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function UserProfilePage() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);

    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const p = await getUserProfile(auth.user!.uid);
                if (p) {
                    setProfile(p);
                    setDisplayName(p.displayName);
                    setPhone(p.phone || "");
                    setAddress(p.address || "");
                    if (p.photoURL) setPhotoPreview(p.photoURL);
                }
            } catch (e) {
                console.error("Failed to load user profile:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.user) return;

        if (!displayName.trim() || !phone.trim() || !address.trim()) {
            addToast("warning", t("toast.fillRequired"));
            return;
        }

        setSaving(true);
        try {
            let photoURL = profile?.photoURL || null;
            if (photoFile) {
                photoURL = await uploadProfilePhoto(auth.user.uid, photoFile);
            }

            await updateUserProfile(auth.user.uid, {
                displayName: displayName.trim(),
                phone: phone.trim(),
                address: address.trim(),
                photoURL,
            });

            await auth.refreshProfile();
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to save profile:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        const email = profile?.email || auth.user?.email;
        if (!email) return;

        setSendingReset(true);
        try {
            await resetPassword(email);
            addToast("success", t("auth.resetSent"));
        } catch (err) {
            console.error("Failed to send password reset:", err);
            addToast("error", t("auth.resetFailed"));
        } finally {
            setSendingReset(false);
        }
    };

    return (
        <AuthGuard>
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6">{t("profile.myProfile")}</h1>

                        <ContentLoader loading={loading} skeleton={
                            <div className="space-y-4">
                                <SkeletonBlock className="w-24 h-24 rounded-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                            </div>
                        }>
                            <div className="space-y-6">
                                {/* Personal Info Section */}
                                <form onSubmit={handleSave} className="space-y-5 bg-surface rounded-2xl border border-foreground/6 p-6">
                                    <h2 className="text-lg font-semibold">{t("profile.edit.personalInfo")}</h2>

                                    {/* Photo */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-foreground/10 overflow-hidden flex items-center justify-center">
                                                {photoPreview ? (
                                                    <img loading="lazy" src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera size={32} className="text-foreground/30" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                                                <Camera size={14} />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-foreground/40">{t("profile.profilePhoto")}</p>
                                    </div>

                                    <Input
                                        label={t("profile.fullName") + " *"}
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />

                                    <Input
                                        label={t("profile.phone") + " *"}
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />

                                    <Input
                                        label={t("profile.address") + " *"}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />

                                    <div className="flex gap-3 pt-2">
                                        <Button fullWidth disabled={saving}>
                                            {saving ? t("profile.saving") : t("common.save")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            fullWidth
                                            onClick={() => navigate(-1)}
                                        >
                                            {t("common.cancel")}
                                        </Button>
                                    </div>
                                </form>

                                {/* Account Section */}
                                <div className="bg-surface rounded-2xl border border-foreground/6 p-6 space-y-4">
                                    <h2 className="text-lg font-semibold">{t("profile.edit.account")}</h2>

                                    {/* Email — read only */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-foreground/60">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Mail size={14} />
                                                {t("auth.email")}
                                            </span>
                                        </label>
                                        <p className="px-4 py-3 border border-foreground/6 rounded-lg bg-foreground/5 text-foreground/60 text-sm">
                                            {profile?.email || auth.user?.email}
                                        </p>
                                    </div>

                                    {/* Change Password */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-foreground/60">
                                            <span className="inline-flex items-center gap-1.5">
                                                <KeyRound size={14} />
                                                {t("profile.edit.password")}
                                            </span>
                                        </label>
                                        <p className="text-xs text-foreground/40 mb-3">
                                            {t("profile.edit.passwordDesc")}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleResetPassword}
                                            disabled={sendingReset}
                                        >
                                            {sendingReset ? t("common.saving") : t("profile.edit.changePassword")}
                                        </Button>
                                    </div>
                                </div>

                                {/* Documents Section — Coming Soon */}
                                <div className="bg-surface rounded-2xl border border-foreground/6 p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lock size={14} className="text-foreground/30" />
                                        <h2 className="text-lg font-semibold text-foreground/50">{t("profile.edit.documents")}</h2>
                                        <span className="text-xs font-medium text-foreground/40 uppercase tracking-wide bg-foreground/5 px-2 py-0.5 rounded">
                                            {t("profile.comingSoon")}
                                        </span>
                                    </div>

                                    <div className="space-y-3 opacity-50 pointer-events-none">
                                        <Input
                                            label={t("profile.ssn")}
                                            placeholder="1234567890123"
                                            value=""
                                            onChange={() => {}}
                                            disabled
                                        />

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground/50">
                                                {t("profile.documents")}
                                            </label>
                                            <div className="border-2 border-dashed border-foreground/6 rounded-lg p-4 text-center">
                                                <p className="text-xs text-foreground/30">{t("profile.documentsPlaceholder")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ContentLoader>
                    </main>
                </div>
            </div>
            </PageTransition>
        </AuthGuard>
    );
}
