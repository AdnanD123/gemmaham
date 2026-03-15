import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { getUserProfile, updateUserProfile } from "../../lib/firestore";
import { uploadProfilePhoto } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, UserProfile } from "@gemmaham/shared";

export default function UserProfilePage() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to save profile:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthGuard>
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6">{t("profile.myProfile")}</h1>

                        {loading ? (
                            <div className="space-y-4">
                                <SkeletonBlock className="w-24 h-24 rounded-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-5 bg-surface rounded-xl border-2 border-foreground/10 p-6">
                                {/* Photo */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-foreground/10 overflow-hidden flex items-center justify-center">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
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
                                </div>

                                {/* Email — read only */}
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-foreground/60">{t("auth.email")}</label>
                                    <p className="px-4 py-3 border-2 border-foreground/10 rounded-lg bg-foreground/5 text-foreground/60 text-sm">
                                        {profile?.email || auth.user?.email}
                                    </p>
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

                                <Button fullWidth disabled={saving}>
                                    {saving ? t("profile.saving") : t("common.save")}
                                </Button>
                            </form>
                        )}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
