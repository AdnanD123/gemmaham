import { useMemo } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
    ArrowLeft,
    Phone,
    Mail,
    Globe,
    Wrench,
    Building2,
    CheckCircle2,
    Clock,
    Calendar,
    ChevronDown,
    MessageSquare,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import { PageTransition } from "../../components/ui/PageTransition";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { useContractor } from "../../lib/hooks/useContractor";
import { formatTimestamp } from "@gemmaham/shared";
import type { AuthContext } from "@gemmaham/shared";

/* ─── Staggered card wrapper ─────────────────────────── */
function FadeInSection({ children, delay = 0, className = "" }: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ─── Initials circle fallback ───────────────────────── */
function InitialsAvatar({ name, size = "lg" }: { name: string; size?: "lg" | "sm" }) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const dim = size === "lg" ? "w-24 h-24 text-2xl" : "w-14 h-14 text-base";
    return (
        <div className={`${dim} rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0`}>
            {initials}
        </div>
    );
}

/* ─── Stats pill ─────────────────────────────────────── */
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-foreground/6">
            <div className="p-2 rounded-lg bg-primary/8">{icon}</div>
            <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

/* ─── Main component ─────────────────────────────────── */
export default function PublicContractorProfile() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useOutletContext<AuthContext>();
    const { profile, assignments, loading } = useContractor(id);

    const stats = useMemo(() => {
        const completed = assignments.filter((a) => a.status === "completed").length;
        const inProgress = assignments.filter((a) => a.status === "in_progress").length;
        return { completed, inProgress };
    }, [assignments]);

    const isCompanyUser = auth?.role === "company";

    const handleContact = () => {
        if (!profile) return;
        navigate(`/company/messages?contractorId=${profile.id}`);
    };

    return (
        <div className="home">
            <PageTransition className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Back link */}
                <Link
                    to="/buildings"
                    className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> {t("common.back")}
                </Link>

                <ContentLoader
                    loading={loading}
                    skeleton={
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <SkeletonBlock className="w-24 h-24 rounded-2xl" />
                                <div className="space-y-2">
                                    <SkeletonLine className="h-7 w-56" />
                                    <SkeletonLine className="h-4 w-36" />
                                    <SkeletonLine className="h-5 w-44" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    <SkeletonBlock className="h-32 w-full rounded-2xl" />
                                    <SkeletonBlock className="h-48 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-4">
                                    <SkeletonBlock className="h-24 w-full rounded-2xl" />
                                    <SkeletonBlock className="h-36 w-full rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    }
                >
                    {!profile ? (
                        <div className="text-center py-16 bg-surface rounded-2xl border border-foreground/6 shadow-card">
                            <Wrench size={36} className="mx-auto text-foreground/20 mb-3" />
                            <p className="text-foreground/50 text-lg">{t("contractor.notFound")}</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Hero Section ─────────────────────── */}
                            <FadeInSection delay={0}>
                                <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6 sm:p-8 mb-6">
                                    <div className="flex flex-col sm:flex-row items-start gap-5">
                                        {/* Avatar / Logo */}
                                        {profile.logoUrl ? (
                                            <img
                                                src={profile.logoUrl}
                                                alt={profile.displayName}
                                                className="w-24 h-24 rounded-2xl object-cover shrink-0"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <InitialsAvatar name={profile.displayName} size="lg" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">
                                                {profile.displayName}
                                            </h1>
                                            <p className="text-foreground/60 text-lg mt-1">
                                                {profile.companyName}
                                            </p>

                                            {/* Category badges */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {profile.categories && profile.categories.length > 0 ? (
                                                    profile.categories.map((cat) => (
                                                        <Badge key={cat.category} variant="default">
                                                            {t(`contractorCategories.categories.${cat.category}`)}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge>{t(`contractor.specialties.${profile.specialty}`)}</Badge>
                                                )}
                                            </div>

                                            {/* Member since */}
                                            {profile.createdAt && (
                                                <p className="text-xs text-foreground/40 mt-3 flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {t("contractor.memberSince", {
                                                        date: formatTimestamp(profile.createdAt),
                                                    })}
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact button — desktop */}
                                        {isCompanyUser && (
                                            <button
                                                onClick={handleContact}
                                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
                                            >
                                                <MessageSquare size={16} />
                                                {t("contractor.contactContractor")}
                                            </button>
                                        )}
                                    </div>

                                    {/* Contact button — mobile */}
                                    {isCompanyUser && (
                                        <button
                                            onClick={handleContact}
                                            className="sm:hidden flex items-center justify-center gap-2 w-full mt-5 px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                                        >
                                            <MessageSquare size={16} />
                                            {t("contractor.contactContractor")}
                                        </button>
                                    )}
                                </div>
                            </FadeInSection>

                            {/* ── 2-Column Layout ─────────────────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* ── Main Content (left) ────────────── */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* About Section */}
                                    {profile.description && (
                                        <FadeInSection delay={0.08}>
                                            <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6">
                                                <h2 className="text-lg font-bold mb-3">{t("contractor.about")}</h2>
                                                <p className="text-foreground/70 leading-relaxed whitespace-pre-line">
                                                    {profile.description}
                                                </p>
                                            </div>
                                        </FadeInSection>
                                    )}

                                    {/* Categories & Specialties */}
                                    {profile.categories && profile.categories.length > 0 && (
                                        <FadeInSection delay={0.16}>
                                            <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6">
                                                <h2 className="text-lg font-bold mb-4">
                                                    {t("contractor.specialtiesSection")}
                                                </h2>
                                                <div className="space-y-4">
                                                    {profile.categories.map((cat) => (
                                                        <details
                                                            key={cat.category}
                                                            className="group"
                                                            open
                                                        >
                                                            <summary className="flex items-center gap-2 cursor-pointer select-none py-2 px-3 -mx-3 rounded-xl hover:bg-foreground/3 transition-colors">
                                                                <ChevronDown
                                                                    size={16}
                                                                    className="text-foreground/40 transition-transform group-open:rotate-180"
                                                                />
                                                                <span className="font-semibold text-foreground/80">
                                                                    {t(`contractorCategories.categories.${cat.category}`)}
                                                                </span>
                                                                <span className="text-xs text-foreground/40 ml-auto">
                                                                    {cat.subcategories.length}
                                                                </span>
                                                            </summary>
                                                            <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                                                                {cat.subcategories.map((sub) => (
                                                                    <Badge key={sub} variant="default">
                                                                        {t(`contractorCategories.subcategories.${sub}`)}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    ))}
                                                </div>
                                            </div>
                                        </FadeInSection>
                                    )}

                                    {/* Project History */}
                                    <FadeInSection delay={0.24}>
                                        <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6">
                                            <h2 className="text-lg font-bold mb-4">
                                                {t("contractor.projectHistory")}
                                            </h2>

                                            {assignments.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Building2 size={28} className="mx-auto text-foreground/15 mb-2" />
                                                    <p className="text-foreground/40 text-sm">
                                                        {t("contractor.noProjects")}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {assignments.map((a, i) => (
                                                        <motion.div
                                                            key={a.id}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 + i * 0.05 }}
                                                        >
                                                            <Link
                                                                to={`/buildings/${a.buildingId}`}
                                                                className="flex items-center gap-3 p-3 bg-background rounded-xl border border-foreground/6 hover:border-primary/30 transition-colors group"
                                                            >
                                                                <div className="p-2 rounded-lg bg-foreground/4 group-hover:bg-primary/8 transition-colors">
                                                                    <Building2 size={16} className="text-foreground/40 group-hover:text-primary transition-colors" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">
                                                                        {a.buildingName}
                                                                    </p>
                                                                    <p className="text-xs text-foreground/40 truncate">
                                                                        {a.trade}
                                                                    </p>
                                                                </div>
                                                                <Badge
                                                                    variant={
                                                                        a.status === "completed"
                                                                            ? "completed"
                                                                            : a.status === "in_progress"
                                                                              ? "in_progress"
                                                                              : "upcoming"
                                                                    }
                                                                >
                                                                    {t(`contractor.status.${a.status}`)}
                                                                </Badge>
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FadeInSection>
                                </div>

                                {/* ── Sidebar (right) ────────────────── */}
                                <div className="space-y-6">
                                    {/* Stats */}
                                    <FadeInSection delay={0.1}>
                                        <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-5 space-y-3">
                                            <StatPill
                                                icon={<CheckCircle2 size={18} className="text-secondary" />}
                                                label={t("contractor.completedProjects")}
                                                value={stats.completed}
                                            />
                                            <StatPill
                                                icon={<Clock size={18} className="text-primary" />}
                                                label={t("contractor.inProgress")}
                                                value={stats.inProgress}
                                            />
                                        </div>
                                    </FadeInSection>

                                    {/* Contact Info */}
                                    {(profile.phone || profile.email || profile.website) && (
                                        <FadeInSection delay={0.18}>
                                            <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-5">
                                                <h3 className="font-bold mb-3">{t("contractor.contactInfo")}</h3>
                                                <div className="space-y-3">
                                                    {profile.phone && (
                                                        <a
                                                            href={`tel:${profile.phone}`}
                                                            className="flex items-center gap-3 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                                        >
                                                            <div className="p-1.5 rounded-lg bg-foreground/4">
                                                                <Phone size={14} className="text-foreground/50" />
                                                            </div>
                                                            {profile.phone}
                                                        </a>
                                                    )}
                                                    {profile.email && (
                                                        <a
                                                            href={`mailto:${profile.email}`}
                                                            className="flex items-center gap-3 text-sm text-foreground/70 hover:text-foreground transition-colors"
                                                        >
                                                            <div className="p-1.5 rounded-lg bg-foreground/4">
                                                                <Mail size={14} className="text-foreground/50" />
                                                            </div>
                                                            {profile.email}
                                                        </a>
                                                    )}
                                                    {profile.website && (
                                                        <a
                                                            href={profile.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 text-sm text-primary hover:text-primary/80 transition-colors"
                                                        >
                                                            <div className="p-1.5 rounded-lg bg-primary/6">
                                                                <Globe size={14} className="text-primary" />
                                                            </div>
                                                            <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </FadeInSection>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </ContentLoader>
            </PageTransition>
        </div>
    );
}
