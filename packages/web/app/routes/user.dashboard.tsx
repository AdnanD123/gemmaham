import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock, Lock, Trophy, MessageSquare, Palette } from "lucide-react";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import StatCard from "../../components/StatCard";
import DashboardPropertyList from "../../components/DashboardPropertyList";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { getUserReservations, getUserCustomizationRequests, getFlat, getHouse } from "../../lib/firestore";
import { updateReservationStatus } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Reservation } from "@gemmaham/shared";

export default function UserDashboard() {
    const auth = useOutletContext<AuthContext>();
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [propertyTitles, setPropertyTitles] = useState<Map<string, string>>(new Map());
    const [stats, setStats] = useState({ active: 0, planned: 0, completed: 0, customizations: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const [resResult, requests] = await Promise.all([
                    getUserReservations(auth.user!.uid),
                    getUserCustomizationRequests(auth.user!.uid).catch(() => []),
                ]);
                const res = resResult.items;
                setReservations(res);

                // Fetch property titles
                const titles = new Map<string, string>();
                await Promise.all(
                    res.map(async (r) => {
                        try {
                            if (r.propertyType === "house" && r.houseId) {
                                const house = await getHouse(r.houseId);
                                if (house) titles.set(r.houseId, house.title);
                            } else if (r.flatId) {
                                const flat = await getFlat(r.flatId);
                                if (flat) titles.set(r.flatId, flat.title);
                            }
                        } catch {}
                    }),
                );
                setPropertyTitles(titles);

                setStats({
                    active: res.filter((r) => ["approved", "reserved"].includes(r.status)).length,
                    planned: res.filter((r) => r.status === "requested").length,
                    completed: res.filter((r) => r.status === "completed").length,
                    customizations: requests.length,
                });
            } catch (e) {
                console.error("Failed to load dashboard:", e);
                addToast("error", t("errors.loadFailed"));
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const handleCancel = async (id: string) => {
        try {
            await updateReservationStatus(id, "cancelled");
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "cancelled" } : r));
            addToast("success", t("toast.reservationCancelled"));
        } catch {
            addToast("error", t("toast.cancelFailed"));
        }
    };

    return (
        <AuthGuard>
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="text-2xl font-bold mb-2">
                            {auth.user?.displayName ? t("user.welcome", { name: auth.user.displayName }) : t("user.dashboard")}
                        </h1>
                        <p className="text-foreground/50 mb-8">{t("user.browseDesc")}</p>

                        {loading ? (
                            <DashboardSkeleton />
                        ) : (
                            <>
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    <StatCard icon={Lock} value={stats.active} label={t("dashboard.active")} linkTo="/user/reservations" />
                                    <StatCard icon={Clock} value={stats.planned} label={t("dashboard.planned")} linkTo="/user/reservations" />
                                    <StatCard icon={Trophy} value={stats.completed} label={t("dashboard.completed")} linkTo="/user/reservations" />
                                    <StatCard icon={MessageSquare} value="—" label={t("nav.messages")} linkTo="/user/messages" />
                                    <StatCard icon={Palette} value={stats.customizations} label={t("flatCustomization.myCustomizations")} linkTo="/user/requests" />
                                </div>

                                {/* Priority-ordered property list */}
                                <h2 className="font-semibold text-lg mb-4">{t("nav.reservations")}</h2>
                                <DashboardPropertyList
                                    reservations={reservations}
                                    propertyTitles={propertyTitles}
                                    onCancel={handleCancel}
                                />
                            </>
                        )}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
