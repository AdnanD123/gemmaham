import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate, Link } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { ArrowLeft, Bed, Bath, Maximize, LandPlot, Layers, Car, TreePine, Waves } from "lucide-react";
import Navbar from "../../components/Navbar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Textarea from "../../components/ui/Textarea";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { getHouse, getCompany, createReservation, getUserReservationForProperty, getOrCreateHouseConversation } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, House, Company, FinancingMethod, UrgencyLevel } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";
import { PhotoGallery } from "../../components/PhotoGallery";

export default function HouseDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [house, setHouse] = useState<House | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [existingReservation, setExistingReservation] = useState<any>(null);
    const [showReserve, setShowReserve] = useState(false);
    const [notes, setNotes] = useState("");
    const [preferredMoveIn, setPreferredMoveIn] = useState("");
    const [financingMethod, setFinancingMethod] = useState<FinancingMethod | "">("");
    const [occupants, setOccupants] = useState("");
    const [urgency, setUrgency] = useState<UrgencyLevel | "">("");
    const [specialRequirements, setSpecialRequirements] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const h = await getHouse(id);
                setHouse(h);
                if (h) {
                    const c = await getCompany(h.companyId);
                    setCompany(c);
                    if (auth.user) {
                        const existing = await getUserReservationForProperty(auth.user.uid, "house", id);
                        setExistingReservation(existing);
                    }
                }
            } catch (err) {
                console.error("Failed to load house:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, auth.user]);

    const handleReserve = async () => {
        if (!auth.user || !house) return;
        setSubmitting(true);
        try {
            const userSnapshot = {
                displayName: auth.user.displayName || "",
                email: auth.user.email || "",
                phone: null,
                photoURL: null,
            };
            await createReservation(
                {
                    propertyType: "house",
                    flatId: null,
                    houseId: house.id,
                    userId: auth.user.uid,
                    companyId: house.companyId,
                    requestDate: new Date().toISOString(),
                    notes,
                    companyNotes: null,
                    userSnapshot,
                    ...(preferredMoveIn && { preferredMoveIn }),
                    ...(financingMethod && { financingMethod }),
                    ...(occupants && { occupants: parseInt(occupants, 10) }),
                    ...(urgency && { urgency }),
                    ...(specialRequirements && { specialRequirements }),
                },
                userSnapshot,
            );
            addToast("success", t("toast.reservationSent"));
            setShowReserve(false);
            setNotes("");
            setPreferredMoveIn("");
            setFinancingMethod("");
            setOccupants("");
            setUrgency("");
            setSpecialRequirements("");
            const existing = await getUserReservationForProperty(auth.user.uid, "house", house.id);
            setExistingReservation(existing);
        } catch (err) {
            addToast("error", t("toast.reservationFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleMessage = async () => {
        if (!auth.user || !house || !company) return;
        try {
            const { id: convId } = await getOrCreateHouseConversation(
                house.id,
                auth.user.uid,
                house.companyId,
                { houseTitle: house.title, companyName: company.name, userName: auth.user.displayName || "" },
            );
            navigate(`/user/messages/${convId}`);
        } catch (err) {
            addToast("error", t("houses.messageFailed"));
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <PageTransition>
                <main className="max-w-4xl mx-auto px-4 py-8 mt-20">
                    <div className="animate-pulse space-y-4">
                        <div className="h-64 bg-foreground/10 rounded-xl" />
                        <div className="h-8 bg-foreground/10 rounded w-1/2" />
                        <div className="h-4 bg-foreground/10 rounded w-1/3" />
                    </div>
                </main>
                </PageTransition>
            </>
        );
    }

    if (!house) {
        return (
            <>
                <Navbar />
                <PageTransition>
                <main className="max-w-4xl mx-auto px-4 py-8 mt-20 text-center">
                    <p className="text-foreground/50">{t("houses.notFound")}</p>
                    <Link to="/properties"><Button variant="ghost" className="mt-4">{t("houses.backToBrowse")}</Button></Link>
                </main>
                </PageTransition>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <PageTransition>
            <main className="max-w-4xl mx-auto px-4 py-8 mt-20">
                <Link to="/properties" className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground mb-4">
                    <ArrowLeft size={16} /> {t("houses.backToBrowse")}
                </Link>

                {/* Cover image */}
                {(house.coverImageUrl || house.floorPlanUrl) && (
                    <img loading="lazy"
                        src={house.coverImageUrl || house.floorPlanUrl}
                        alt={house.title}
                        className="w-full h-64 md:h-80 object-cover rounded-xl mb-6"
                    />
                )}

                <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-serif text-3xl font-bold">{house.title}</h1>
                    <Badge variant={house.status}>{house.status}</Badge>
                    <Badge variant={house.houseType}>{house.houseType.replace("_", " ")}</Badge>
                </div>

                <p className="text-foreground/50 mb-4">{house.address}</p>
                <p className="text-primary font-bold text-2xl mb-6">{house.currency} {house.price.toLocaleString()}</p>

                {/* Specs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                        <Bed size={18} className="text-foreground/40" />
                        <div>
                            <p className="font-semibold">{house.bedrooms}</p>
                            <p className="text-xs text-foreground/50">{t("houses.bedrooms")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                        <Bath size={18} className="text-foreground/40" />
                        <div>
                            <p className="font-semibold">{house.bathrooms}</p>
                            <p className="text-xs text-foreground/50">{t("houses.bathrooms")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                        <Maximize size={18} className="text-foreground/40" />
                        <div>
                            <p className="font-semibold">{house.area} {house.areaUnit}</p>
                            <p className="text-xs text-foreground/50">{t("houses.area")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                        <LandPlot size={18} className="text-foreground/40" />
                        <div>
                            <p className="font-semibold">{house.lotSize} {house.lotSizeUnit}</p>
                            <p className="text-xs text-foreground/50">{t("houses.lotSize")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                        <Layers size={18} className="text-foreground/40" />
                        <div>
                            <p className="font-semibold">{house.stories}</p>
                            <p className="text-xs text-foreground/50">{t("houses.stories")}</p>
                        </div>
                    </div>
                    {house.garage && (
                        <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                            <Car size={18} className="text-foreground/40" />
                            <div>
                                <p className="font-semibold">{house.garageSpaces}</p>
                                <p className="text-xs text-foreground/50">{t("houses.garageSpaces")}</p>
                            </div>
                        </div>
                    )}
                    {house.hasYard && (
                        <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                            <TreePine size={18} className="text-foreground/40" />
                            <div>
                                <p className="font-semibold">Yes</p>
                                <p className="text-xs text-foreground/50">{t("houses.yard")}</p>
                            </div>
                        </div>
                    )}
                    {house.hasPool && (
                        <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-foreground/6">
                            <Waves size={18} className="text-foreground/40" />
                            <div>
                                <p className="font-semibold">Yes</p>
                                <p className="text-xs text-foreground/50">{t("houses.pool")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="mb-6">
                    <h2 className="font-semibold text-lg mb-2">{t("houses.description")}</h2>
                    <p className="text-foreground/70 whitespace-pre-wrap">{house.description}</p>
                </div>

                {/* Floor plan */}
                {house.floorPlanUrl && (
                    <div className="mb-6">
                        <h2 className="font-semibold text-lg mb-2">{t("houses.floorPlan")}</h2>
                        <img loading="lazy" src={house.floorPlanUrl} alt="Floor plan" className="rounded-xl max-h-96 object-contain" />
                    </div>
                )}

                {/* Photo Gallery */}
                <PhotoGallery photos={house.photos || []} alt={house.title} />

                {/* Listed by */}
                {company && (
                    <p className="text-sm text-foreground/50 mb-6">{t("houses.listedBy")}: {company.name}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {auth.user && auth.role === "user" ? (
                        existingReservation ? (
                            <Badge variant={existingReservation.status} className="text-sm px-4 py-2">
                                {t(`reservation.status.${existingReservation.status}`)}
                            </Badge>
                        ) : house.status === "available" ? (
                            <Button onClick={() => setShowReserve(true)}>{t("houses.reserveHouse")}</Button>
                        ) : house.status === "reserved" ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="reserved">{t("filters.reserved")}</Badge>
                                <span className="text-sm text-foreground/50">{t("houses.statusReserved")}</span>
                            </div>
                        ) : house.status === "sold" ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="sold">{t("filters.sold")}</Badge>
                                <span className="text-sm text-foreground/50">{t("houses.statusSold")}</span>
                            </div>
                        ) : null
                    ) : !auth.user ? (
                        <Link to="/auth/login">
                            <Button>{t("houses.signInToReserve")}</Button>
                        </Link>
                    ) : null}
                    {auth.user && (
                        <Button variant="secondary" onClick={handleMessage}>{t("houses.messageCompany")}</Button>
                    )}
                </div>
            </main>
            </PageTransition>

            {/* Reserve modal */}
            {showReserve && (
                <Modal onClose={() => setShowReserve(false)} title={t("houses.reserveHouse")}>
                    <p className="text-sm text-foreground/60 mb-4">
                        <Trans
                            i18nKey="houses.reserveConfirm"
                            values={{ title: house.title, currency: house.currency, price: house.price.toLocaleString() }}
                            components={{ strong: <strong /> }}
                        />
                    </p>
                    <Textarea
                        label={t("flats.notesOptional")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("flats.notesPlaceholder")}
                    />

                    {/* Additional Information */}
                    <div className="border-t border-foreground/6 pt-4 mt-4">
                        <p className="text-sm font-medium mb-3">{t("reservation.additionalInfo")}</p>
                        <div className="space-y-3">
                            <Input
                                label={t("reservation.preferredMoveIn")}
                                type="date"
                                value={preferredMoveIn}
                                onChange={(e) => setPreferredMoveIn(e.target.value)}
                            />
                            <Select
                                label={t("reservation.financingMethod")}
                                value={financingMethod}
                                onChange={(e) => setFinancingMethod(e.target.value as FinancingMethod | "")}
                                options={[
                                    { value: "", label: "—" },
                                    { value: "cash", label: t("reservation.cash") },
                                    { value: "mortgage", label: t("reservation.mortgage") },
                                    { value: "other", label: t("reservation.other") },
                                ]}
                            />
                            <Input
                                label={t("reservation.occupants")}
                                type="number"
                                min={1}
                                value={occupants}
                                onChange={(e) => setOccupants(e.target.value)}
                            />
                            <Select
                                label={t("reservation.urgency")}
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value as UrgencyLevel | "")}
                                options={[
                                    { value: "", label: "—" },
                                    { value: "browsing", label: t("reservation.browsing") },
                                    { value: "3months", label: t("reservation.within3Months") },
                                    { value: "urgent", label: t("reservation.urgent") },
                                ]}
                            />
                            <Textarea
                                label={t("reservation.specialRequirements")}
                                placeholder={t("reservation.specialRequirementsPlaceholder")}
                                value={specialRequirements}
                                onChange={(e) => setSpecialRequirements(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleReserve} disabled={submitting}>
                            {submitting ? t("houses.sending") : t("houses.confirmReservation")}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowReserve(false)}>{t("common.cancel")}</Button>
                    </div>
                </Modal>
            )}
        </>
    );
}
