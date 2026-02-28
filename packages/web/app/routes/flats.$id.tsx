import { useState, useEffect, useMemo } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { Bed, Bath, Maximize, MapPin, Eye, Lock, Phone, Mail, Globe, Clock, Calculator, Palette, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Textarea from "../../components/ui/Textarea";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
    getFlat, getCompany, getBuilding, getCustomizationOptions,
    getContractors, createReservation, getOrCreateConversation,
    createCustomizationRequest, getUserCustomizationRequests,
    updateCustomizationRequestStatus, getUserReservationForFlat,
    getReservationsForFlat, getUserProfile,
} from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import { SkeletonBlock, SkeletonLine } from "../../components/ui/Skeleton";
import type { AuthContext, Flat, Company, Building, CustomizationOption, Contractor, CustomizationRequest, Reservation } from "@gemmaham/shared";

// Parse price impact strings like "+€1,500 for Oak" → 1500
function parsePriceImpact(priceImpact: string | null, selectedChoice: string, defaultOption: string): number {
    if (!priceImpact || selectedChoice === defaultOption) return 0;
    const match = priceImpact.match(/([+-])?[€$£]?([\d,]+)/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    const amount = parseInt(match[2].replace(/,/g, ""), 10);
    return sign * amount;
}

// Calculate days remaining until deadline
function getDaysRemaining(deadline: string | null): number | null {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function FlatDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [flat, setFlat] = useState<Flat | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [building, setBuilding] = useState<Building | null>(null);
    const [customizations, setCustomizations] = useState<CustomizationOption[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [userRequests, setUserRequests] = useState<CustomizationRequest[]>([]);
    const [userReservation, setUserReservation] = useState<Reservation | null>(null);
    const [totalActiveRequests, setTotalActiveRequests] = useState(0);
    const [loading, setLoading] = useState(true);

    // Reserve modal state
    const [reserveOpen, setReserveOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Customization selection state: optionId → selected choice
    const [selections, setSelections] = useState<Record<string, string>>({});

    // Request modal state
    const [requestModalOption, setRequestModalOption] = useState<CustomizationOption | null>(null);
    const [requestNotes, setRequestNotes] = useState("");
    const [requestSubmitting, setRequestSubmitting] = useState(false);

    // Cancel request state
    const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    const { addToast } = useToast();

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const f = await getFlat(id);
                setFlat(f);

                if (f) {
                    const c = await getCompany(f.companyId);
                    setCompany(c);

                    const b = await getBuilding(f.buildingId);
                    setBuilding(b);

                    try {
                        const opts = await getCustomizationOptions(id);
                        setCustomizations(opts);
                    } catch {
                        setCustomizations([]);
                    }

                    try {
                        const ctrs = await getContractors(f.buildingId);
                        setContractors(ctrs);
                    } catch {
                        setContractors([]);
                    }
                }
            } catch (e) {
                console.error("Failed to load flat:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Load user's existing customization requests and reservation for this flat
    useEffect(() => {
        if (!auth.user || !id) return;
        (async () => {
            try {
                const [allRequests, reservation] = await Promise.all([
                    getUserCustomizationRequests(auth.user!.uid),
                    getUserReservationForFlat(auth.user!.uid, id),
                ]);
                setUserRequests(allRequests.filter((r) => r.flatId === id));
                setUserReservation(reservation);
            } catch {
                // Silently fail
            }
        })();
    }, [auth.user, id]);

    // Load total active requests count for queue position
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const allReservations = await getReservationsForFlat(id);
                setTotalActiveRequests(
                    allReservations.filter((r) => ["requested", "approved", "reserved"].includes(r.status)).length
                );
            } catch {
                // Silently fail
            }
        })();
    }, [id]);

    // Initialize selections with default options
    useEffect(() => {
        if (customizations.length === 0) return;
        const defaults: Record<string, string> = {};
        customizations.forEach((opt) => {
            defaults[opt.id] = opt.defaultOption;
        });
        setSelections(defaults);
    }, [customizations]);

    // Calculate price deltas for the running calculator
    const priceDeltas = useMemo(() => {
        const deltas: { optionId: string; title: string; amount: number }[] = [];
        customizations.forEach((opt) => {
            const selected = selections[opt.id] || opt.defaultOption;
            const delta = parsePriceImpact(opt.priceImpact, selected, opt.defaultOption);
            if (delta !== 0) {
                deltas.push({ optionId: opt.id, title: opt.title, amount: delta });
            }
        });
        return deltas;
    }, [customizations, selections]);

    const totalDelta = useMemo(() => priceDeltas.reduce((sum, d) => sum + d.amount, 0), [priceDeltas]);

    // Find existing request for an option
    const getExistingRequest = (optionId: string) =>
        userRequests.find((r) => r.customizationOptionId === optionId && r.status !== "cancelled");

    const handleSelectChoice = (optionId: string, choice: string, locked: boolean) => {
        if (locked) return;
        const existing = getExistingRequest(optionId);
        if (existing) return; // Can't change if already requested
        setSelections((prev) => ({ ...prev, [optionId]: choice }));
    };

    const handleRequestChange = (opt: CustomizationOption) => {
        setRequestModalOption(opt);
        setRequestNotes("");
    };

    const handleSubmitRequest = async () => {
        if (!requestModalOption || !auth.user || !flat || !userReservation) return;
        setRequestSubmitting(true);
        try {
            await createCustomizationRequest({
                flatId: flat.id,
                buildingId: flat.buildingId,
                userId: auth.user.uid,
                reservationId: userReservation.id,
                customizationOptionId: requestModalOption.id,
                selectedOption: selections[requestModalOption.id] || requestModalOption.defaultOption,
                notes: requestNotes,
                status: "pending",
                companyNotes: null,
                reviewedAt: null,
            });
            addToast("success", t("flatCustomization.requestSubmitted"));
            setRequestModalOption(null);
            setRequestNotes("");
            // Reload user requests
            const allRequests = await getUserCustomizationRequests(auth.user.uid);
            setUserRequests(allRequests.filter((r) => r.flatId === flat.id));
        } catch (e) {
            console.error("Failed to submit request:", e);
            addToast("error", t("toast.requestFailed"));
        } finally {
            setRequestSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!cancelRequestId || !auth.user || !flat) return;
        setCancelLoading(true);
        try {
            await updateCustomizationRequestStatus(cancelRequestId, "cancelled");
            addToast("success", t("toast.requestCancelled"));
            setCancelRequestId(null);
            const allRequests = await getUserCustomizationRequests(auth.user.uid);
            setUserRequests(allRequests.filter((r) => r.flatId === flat.id));
        } catch (e) {
            console.error("Failed to cancel request:", e);
            addToast("error", t("toast.requestFailed"));
        } finally {
            setCancelLoading(false);
        }
    };

    const handleReserve = async () => {
        if (!flat || !auth.user) return;
        setSubmitting(true);
        try {
            // Build user snapshot from profile
            const profile = await getUserProfile(auth.user.uid);
            const userSnapshot = {
                displayName: profile?.displayName || auth.user.displayName || "User",
                email: profile?.email || auth.user.email || "",
                phone: profile?.phone || null,
                photoURL: profile?.photoURL || null,
            };

            await createReservation(
                {
                    flatId: flat.id,
                    userId: auth.user.uid,
                    companyId: flat.companyId,
                    requestDate: new Date().toISOString(),
                    notes,
                    companyNotes: null,
                    userSnapshot,
                },
                userSnapshot,
            );
            setReserveOpen(false);
            setNotes("");
            addToast("success", t("toast.reservationSent"));
            // Reload reservation state
            const reservation = await getUserReservationForFlat(auth.user.uid, flat.id);
            setUserReservation(reservation);
            setTotalActiveRequests((prev) => prev + 1);
        } catch (e) {
            console.error("Failed to reserve:", e);
            addToast("error", t("toast.reservationFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleMessage = async () => {
        if (!flat || !auth.user || !company) return;
        try {
            const { id: conversationId } = await getOrCreateConversation(
                flat.id,
                auth.user.uid,
                flat.companyId,
                {
                    flatTitle: flat.title,
                    companyName: company.name,
                    userName: auth.user.displayName || "User",
                },
            );
            const img = flat.renderedImageUrl || flat.floorPlanUrl;
            navigate(`/user/messages/${conversationId}`, {
                state: {
                    cardData: {
                        title: flat.title,
                        subtitle: flat.address,
                        ...(img && { imageUrl: img }),
                        linkType: "flat" as const,
                        linkId: flat.id,
                    },
                },
            });
        } catch (e) {
            console.error("Failed to start conversation:", e);
        }
    };

    const getProgressWidth = (status: string) => {
        switch (status) {
            case "completed": return "100%";
            case "near_completion": return "85%";
            case "under_construction": return "50%";
            default: return "10%";
        }
    };

    if (loading) {
        return (
            <div className="home">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <SkeletonBlock className="aspect-video rounded-xl" />
                        </div>
                        <div className="space-y-4">
                            <div className="p-6 bg-surface rounded-xl border-2 border-foreground/10 space-y-3">
                                <SkeletonLine className="w-20 h-6 rounded-full" />
                                <SkeletonLine className="w-3/4 h-7" />
                                <SkeletonLine className="w-1/2 h-4" />
                                <SkeletonLine className="w-1/3 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!flat) {
        return (
            <div className="home">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                    <h1 className="text-2xl font-bold mb-2">{t("flats.flatNotFound")}</h1>
                    <Link to="/flats" className="text-primary hover:underline">{t("flats.backToBrowse")}</Link>
                </div>
            </div>
        );
    }

    const activeRequests = userRequests.filter((r) => r.status !== "cancelled");

    return (
        <div className="home">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-24">
                <Link to={building ? `/buildings/${building.id}` : "/buildings"} className="text-sm text-foreground/50 hover:text-foreground mb-4 inline-block">
                    &larr; {building ? building.title : t("flats.backToBrowse")}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Image */}
                        <div className="rounded-xl overflow-hidden border-2 border-foreground/10">
                            {flat.renderedImageUrl || flat.floorPlanUrl ? (
                                <img
                                    src={flat.renderedImageUrl || flat.floorPlanUrl}
                                    alt={flat.title}
                                    className="w-full h-auto object-cover"
                                />
                            ) : (
                                <div className="w-full h-64 bg-foreground/5 flex items-center justify-center">
                                    <span className="text-6xl">🏠</span>
                                </div>
                            )}
                        </div>
                        {flat.renderedImageUrl && flat.floorPlanUrl && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg overflow-hidden border-2 border-foreground/10">
                                    <p className="text-xs font-medium text-foreground/50 p-2 bg-surface">{t("flats.floorPlan")}</p>
                                    <img src={flat.floorPlanUrl} alt="Floor plan" className="w-full h-auto" />
                                </div>
                                <div className="rounded-lg overflow-hidden border-2 border-foreground/10">
                                    <p className="text-xs font-medium text-foreground/50 p-2 bg-surface">{t("flats.render3d")}</p>
                                    <img src={flat.renderedImageUrl} alt="3D render" className="w-full h-auto" />
                                </div>
                            </div>
                        )}

                        {flat.floorPlanUrl && (
                            <Link
                                to={`/visualizer/${flat.id}`}
                                className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                            >
                                <Eye size={16} /> {t("flats.view2d3d")}
                            </Link>
                        )}

                        {/* Description */}
                        {flat.description && (
                            <div className="mt-6">
                                <h2 className="text-lg font-bold mb-2">{t("flats.description")}</h2>
                                <p className="text-foreground/70 whitespace-pre-wrap">{flat.description}</p>
                            </div>
                        )}

                        {/* Customization Options — Interactive */}
                        {customizations.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-bold mb-4">{t("flatCustomization.availableOptions")}</h2>
                                <div className="space-y-4">
                                    {customizations.map((opt) => {
                                        const contractor = contractors.find((c) => c.id === opt.contractorId);
                                        const existingRequest = getExistingRequest(opt.id);
                                        const selectedChoice = selections[opt.id] || opt.defaultOption;
                                        const isNonDefault = selectedChoice !== opt.defaultOption;
                                        const daysRemaining = getDaysRemaining(opt.deadline);
                                        const deadlinePassed = daysRemaining !== null && daysRemaining < 0;
                                        const isInteractive = !opt.locked && !deadlinePassed && !existingRequest;

                                        return (
                                            <div
                                                key={opt.id}
                                                className={`p-4 bg-surface rounded-xl border-2 transition-colors ${
                                                    existingRequest
                                                        ? "border-primary/30 bg-primary/5"
                                                        : opt.locked || deadlinePassed
                                                          ? "border-foreground/10 opacity-60"
                                                          : isNonDefault
                                                            ? "border-primary/40"
                                                            : "border-foreground/10"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {opt.locked && <Lock size={14} className="text-foreground/40" />}
                                                    <h3 className="font-medium">{opt.title}</h3>
                                                    <Badge variant="default">{t(`customizations.cat.${opt.category}`)}</Badge>
                                                    {existingRequest && (
                                                        <Badge variant={existingRequest.status}>
                                                            {t(`customizations.reqStatus.${existingRequest.status}`)}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {opt.description && (
                                                    <p className="text-sm text-foreground/60 mb-3">{opt.description}</p>
                                                )}

                                                {/* Deadline countdown */}
                                                {daysRemaining !== null && (
                                                    <div className="flex items-center gap-1.5 mb-3">
                                                        <Clock size={13} className={
                                                            deadlinePassed
                                                                ? "text-foreground/30"
                                                                : daysRemaining <= 7
                                                                  ? "text-red-500"
                                                                  : "text-amber-500"
                                                        } />
                                                        <span className={`text-xs font-medium ${
                                                            deadlinePassed
                                                                ? "text-foreground/30"
                                                                : daysRemaining <= 7
                                                                  ? "text-red-500"
                                                                  : "text-amber-500"
                                                        }`}>
                                                            {deadlinePassed
                                                                ? t("flatCustomization.deadlinePassed")
                                                                : daysRemaining <= 7
                                                                  ? t("flatCustomization.daysLeftUrgent", { count: daysRemaining })
                                                                  : t("flatCustomization.daysLeft", { count: daysRemaining })
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Choices as clickable pills */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {opt.options.map((choice) => {
                                                        const isSelected = existingRequest
                                                            ? choice === existingRequest.selectedOption
                                                            : choice === selectedChoice;
                                                        const isDefault = choice === opt.defaultOption;

                                                        return (
                                                            <button
                                                                key={choice}
                                                                type="button"
                                                                disabled={!isInteractive}
                                                                onClick={() => handleSelectChoice(opt.id, choice, opt.locked)}
                                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                                    isSelected
                                                                        ? "bg-primary/15 text-primary border-primary/40 font-medium ring-1 ring-primary/20"
                                                                        : isInteractive
                                                                          ? "bg-foreground/5 text-foreground/60 border-foreground/10 hover:border-primary/30 hover:text-primary/80 cursor-pointer"
                                                                          : "bg-foreground/5 text-foreground/40 border-foreground/10 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                {choice}
                                                                {isDefault && ` (${t("flatCustomization.defaultChoice")})`}
                                                                {isSelected && !isDefault && " \u2713"}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Existing request info */}
                                                {existingRequest && existingRequest.companyNotes && (
                                                    <div className="text-xs bg-foreground/5 rounded-lg p-2 mb-3">
                                                        <span className="font-medium text-foreground/50">{t("customizations.agencyNote")}:</span>{" "}
                                                        <span className="text-foreground/70">{existingRequest.companyNotes}</span>
                                                    </div>
                                                )}

                                                {/* Meta info */}
                                                <div className="flex flex-wrap gap-4 text-xs text-foreground/50">
                                                    {contractor && (
                                                        <span>{t("flatCustomization.handledBy")}: <strong className="text-foreground/70">{contractor.name}</strong> ({contractor.trade})</span>
                                                    )}
                                                    {opt.priceImpact && (
                                                        <span>{t("flatCustomization.priceImpact")}: <strong className="text-foreground/70">{opt.priceImpact}</strong></span>
                                                    )}
                                                </div>

                                                {opt.locked && (
                                                    <p className="text-xs text-foreground/40 mt-2 flex items-center gap-1">
                                                        <Lock size={12} /> {t("flatCustomization.lockedNote")}
                                                    </p>
                                                )}

                                                {/* Request Change button — only for users with approved/reserved reservation */}
                                                {isInteractive && isNonDefault && auth.user && auth.role === "user" && (
                                                    <div className="mt-3 pt-3 border-t border-foreground/10">
                                                        {userReservation && ["approved", "reserved"].includes(userReservation.status) ? (
                                                            <Button
                                                                variant="ghost"
                                                                className="text-sm"
                                                                onClick={() => handleRequestChange(opt)}
                                                            >
                                                                <Palette size={14} className="mr-1.5" />
                                                                {t("flatCustomization.requestChange")}
                                                            </Button>
                                                        ) : (
                                                            <p className="text-xs text-foreground/40">
                                                                {t("flats.reserveToCustomize")}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Sign in prompt for unauthenticated users */}
                                                {isInteractive && isNonDefault && !auth.user && (
                                                    <div className="mt-3 pt-3 border-t border-foreground/10">
                                                        <Link to="/auth/login" className="text-xs text-primary hover:underline">
                                                            {t("flatCustomization.signInToCustomize")}
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* Cancel button for pending requests */}
                                                {existingRequest && existingRequest.status === "pending" && (
                                                    <div className="mt-3 pt-3 border-t border-foreground/10">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCancelRequestId(existingRequest.id)}
                                                            className="text-xs text-red-500 hover:text-red-600 hover:underline"
                                                        >
                                                            {t("flatCustomization.cancelRequest")}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Contractors */}
                        {contractors.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-bold mb-4">{t("flatCustomization.contractors")}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {contractors.map((c) => (
                                        <div
                                            key={c.id}
                                            className={`p-4 bg-surface rounded-xl border-2 border-foreground/10 ${c.status === "completed" ? "opacity-50" : ""}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center text-sm">🔧</div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium text-sm">{c.name}</h3>
                                                        <Badge variant={c.status}>{t(`contractors.status.${c.status}`)}</Badge>
                                                    </div>
                                                    <p className="text-xs text-foreground/50">{c.trade}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${c.status === "completed" ? "bg-green-500" : "bg-primary"}`}
                                                        style={{ width: `${c.progressPercent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-foreground/40 mt-1 block">{c.progressPercent}%</span>
                                            </div>
                                            <div className="flex gap-3 mt-2 text-xs text-foreground/50">
                                                {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                                                {c.website && <span className="flex items-center gap-1"><Globe size={10} /> {c.website}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Flat info card */}
                        <div className="p-6 bg-surface rounded-xl border-2 border-foreground/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={flat.status}>{flat.status}</Badge>
                            </div>
                            <h1 className="text-2xl font-bold">{flat.title}</h1>
                            <p className="flex items-center gap-1 text-foreground/50 text-sm mt-1">
                                <MapPin size={14} /> {flat.address}
                            </p>

                            <p className="text-primary font-bold text-3xl mt-4">
                                {flat.currency} {flat.price.toLocaleString()}
                            </p>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="text-center p-3 bg-background rounded-lg">
                                    <Bed size={18} className="mx-auto mb-1 text-foreground/50" />
                                    <p className="text-sm font-medium">{flat.bedrooms}</p>
                                    <p className="text-xs text-foreground/40">{t("flats.beds")}</p>
                                </div>
                                <div className="text-center p-3 bg-background rounded-lg">
                                    <Bath size={18} className="mx-auto mb-1 text-foreground/50" />
                                    <p className="text-sm font-medium">{flat.bathrooms}</p>
                                    <p className="text-xs text-foreground/40">{t("flats.baths")}</p>
                                </div>
                                <div className="text-center p-3 bg-background rounded-lg">
                                    <Maximize size={18} className="mx-auto mb-1 text-foreground/50" />
                                    <p className="text-sm font-medium">{flat.area}</p>
                                    <p className="text-xs text-foreground/40">{flat.areaUnit}</p>
                                </div>
                            </div>

                            {auth.user && auth.role === "user" && flat.status === "available" && (
                                <div className="space-y-2 mt-6">
                                    {userReservation ? (
                                        <>
                                            <div className="p-3 bg-foreground/5 rounded-lg text-center">
                                                <Badge variant={userReservation.status as any}>
                                                    {t(`reservation.status.${userReservation.status}`)}
                                                </Badge>
                                                <p className="text-xs text-foreground/50 mt-1">
                                                    {t("flats.alreadyRequested")}
                                                </p>
                                            </div>
                                            {totalActiveRequests > 0 && (
                                                <p className="text-xs text-center text-foreground/40">
                                                    {t("flats.queuePosition", {
                                                        position: userReservation.queuePosition || 1,
                                                        total: totalActiveRequests,
                                                    })}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <Button className="w-full" onClick={() => setReserveOpen(true)}>
                                            {t("flats.reserveFlat")}
                                        </Button>
                                    )}
                                    <Button className="w-full" variant="ghost" onClick={handleMessage}>{t("flats.messageCompany")}</Button>
                                </div>
                            )}

                            {!auth.user && flat.status === "available" && (
                                <div className="mt-6">
                                    <Link to="/auth/login">
                                        <Button className="w-full" variant="ghost">{t("flats.signInToReserve")}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Price Calculator Card */}
                        {(priceDeltas.length > 0 || totalDelta !== 0) && (
                            <div className="p-6 bg-surface rounded-xl border-2 border-primary/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calculator size={16} className="text-primary" />
                                    <h3 className="font-bold">{t("flatCustomization.estimatedTotal")}</h3>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-foreground/60">{t("flatCustomization.basePrice")}</span>
                                        <span className="font-medium">{flat.currency} {flat.price.toLocaleString()}</span>
                                    </div>

                                    {priceDeltas.map((d) => (
                                        <div key={d.optionId} className="flex justify-between">
                                            <span className="text-foreground/60 text-xs">{d.title}</span>
                                            <span className={`text-xs font-medium ${d.amount > 0 ? "text-amber-600" : "text-green-600"}`}>
                                                {d.amount > 0 ? "+" : ""}{flat.currency} {d.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}

                                    <div className="border-t border-foreground/10 pt-2 flex justify-between">
                                        <span className="font-bold">{t("flatCustomization.estimatedTotal")}</span>
                                        <span className="font-bold text-primary">
                                            {flat.currency} {(flat.price + totalDelta).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-foreground/40 mt-2">{t("flatCustomization.priceDisclaimer")}</p>
                            </div>
                        )}

                        {/* My Selections Card */}
                        {auth.user && activeRequests.length > 0 && (
                            <div className="p-6 bg-surface rounded-xl border-2 border-foreground/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette size={16} className="text-primary" />
                                    <h3 className="font-bold">{t("flatCustomization.mySelections")}</h3>
                                </div>
                                <div className="space-y-3">
                                    {activeRequests.map((req) => {
                                        const opt = customizations.find((o) => o.id === req.customizationOptionId);
                                        return (
                                            <div key={req.id} className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{opt?.title || req.customizationOptionId}</p>
                                                    <p className="text-xs text-foreground/50">{req.selectedOption}</p>
                                                    {req.companyNotes && (
                                                        <p className="text-xs text-foreground/40 mt-0.5">{req.companyNotes}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Badge variant={req.status}>
                                                        {t(`customizations.reqStatus.${req.status}`)}
                                                    </Badge>
                                                    {req.status === "pending" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCancelRequestId(req.id)}
                                                            className="text-foreground/30 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Building Progress Card */}
                        {building && (
                            <div className="p-6 bg-surface rounded-xl border-2 border-foreground/10">
                                <h3 className="font-bold mb-3">{t("flatCustomization.buildingProgress")}</h3>
                                <Link to={`/buildings/${building.id}`} className="block hover:text-primary transition-colors">
                                    <p className="font-medium">{building.title}</p>
                                </Link>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                                    <span className="text-xs text-foreground/50">{t(`buildings.phase.${building.currentPhase}`)}</span>
                                </div>
                                <div className="mt-3">
                                    <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: getProgressWidth(building.status) }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 text-xs text-foreground/50">
                                    <span>{t("buildings.est")}: {building.estimatedCompletion}</span>
                                    <Link to={`/buildings/${building.id}`} className="text-primary hover:underline">
                                        {t("flatCustomization.viewBuilding")} &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Company Info */}
                        {company && (
                            <div className="p-6 bg-surface rounded-xl border-2 border-foreground/10">
                                <h3 className="font-bold mb-2">{t("flats.listedBy")}</h3>
                                <div className="flex items-center gap-3">
                                    {company.logo && (
                                        <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-full object-cover" />
                                    )}
                                    <div>
                                        <p className="font-medium">{company.name}</p>
                                        <p className="text-xs text-foreground/40">{company.address}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reserve Modal */}
            <Modal isOpen={reserveOpen} onClose={() => setReserveOpen(false)} title={t("flats.reserve")}>
                <div className="space-y-4">
                    <p className="text-foreground/60">
                        <Trans
                            i18nKey="flats.reserveConfirm"
                            values={{ title: flat.title, currency: flat.currency, price: flat.price.toLocaleString() }}
                            components={{ strong: <strong /> }}
                        />
                    </p>
                    <Textarea
                        label={t("flats.notesOptional")}
                        placeholder={t("flats.notesPlaceholder")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setReserveOpen(false)}>{t("flats.cancel")}</Button>
                        <Button onClick={handleReserve} disabled={submitting}>
                            {submitting ? t("flats.sending") : t("flats.confirmReservation")}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Customization Request Modal */}
            {requestModalOption && (
                <Modal
                    isOpen={!!requestModalOption}
                    onClose={() => setRequestModalOption(null)}
                    title={t("flatCustomization.confirmRequestTitle")}
                >
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-foreground/5 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{requestModalOption.title}</span>
                                <Badge variant="default">{t(`customizations.cat.${requestModalOption.category}`)}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground/50">{t("flatCustomization.defaultChoice")}</span>
                                <span className="text-foreground/60">{requestModalOption.defaultOption}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground/50">{t("customizations.selectedOption")}</span>
                                <span className="font-medium text-primary">{selections[requestModalOption.id]}</span>
                            </div>
                            {requestModalOption.priceImpact && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-foreground/50">{t("flatCustomization.priceImpact")}</span>
                                    <span className="font-medium text-amber-600">{requestModalOption.priceImpact}</span>
                                </div>
                            )}
                            {(() => {
                                const contractor = contractors.find((c) => c.id === requestModalOption.contractorId);
                                return contractor ? (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-foreground/50">{t("flatCustomization.handledBy")}</span>
                                        <span className="text-foreground/70">{contractor.name}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {/* Notes */}
                        <Textarea
                            label={t("flatCustomization.requestNotes")}
                            placeholder={t("flatCustomization.requestNotesPlaceholder")}
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                        />

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setRequestModalOption(null)}>
                                {t("common.cancel")}
                            </Button>
                            <Button onClick={handleSubmitRequest} disabled={requestSubmitting}>
                                {requestSubmitting ? t("flatCustomization.submitting") : t("flatCustomization.submitRequest")}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Cancel Request Dialog */}
            <ConfirmDialog
                isOpen={!!cancelRequestId}
                onClose={() => setCancelRequestId(null)}
                onConfirm={handleCancelRequest}
                title={t("customizations.cancelRequestTitle")}
                message={t("customizations.cancelRequestMsg")}
                confirmLabel={t("flatCustomization.cancelRequest")}
                loading={cancelLoading}
            />
        </div>
    );
}
