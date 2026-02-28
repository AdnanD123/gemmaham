import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import CompanySidebar from "../../components/CompanySidebar";
import RoleGuard from "../../components/RoleGuard";
import HouseForm from "../../components/HouseForm";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getHouse, updateHouse, deleteHouse } from "../../lib/firestore";
import { uploadHouseCover, uploadHouseFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, House, AreaUnit, HouseType } from "@gemmaham/shared";

export default function CompanyEditHouse() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [house, setHouse] = useState<House | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const h = await getHouse(id);
            setHouse(h);
            setLoading(false);
        })();
    }, [id]);

    const handleSubmit = async (data: any, coverFile: File | null, floorPlanFile: File | null) => {
        if (!id || !auth.companyId) return;
        setSubmitting(true);
        try {
            await updateHouse(id, {
                title: data.title,
                description: data.description,
                address: data.address,
                price: Number(data.price),
                currency: data.currency,
                bedrooms: Number(data.bedrooms),
                bathrooms: Number(data.bathrooms),
                area: Number(data.area),
                areaUnit: data.areaUnit as AreaUnit,
                lotSize: Number(data.lotSize),
                lotSizeUnit: data.lotSizeUnit as AreaUnit,
                stories: Number(data.stories),
                garage: data.garage,
                garageSpaces: Number(data.garageSpaces),
                hasYard: data.hasYard,
                hasPool: data.hasPool,
                houseType: data.houseType as HouseType,
                yearBuilt: data.yearBuilt || null,
                featured: data.featured,
            });

            if (coverFile) {
                const url = await uploadHouseCover(auth.companyId, id, coverFile);
                await updateHouse(id, { coverImageUrl: url });
            }
            if (floorPlanFile) {
                const url = await uploadHouseFloorPlan(auth.companyId, id, floorPlanFile);
                await updateHouse(id, { floorPlanUrl: url });
            }

            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            addToast("error", t("toast.saveFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await deleteHouse(id);
            addToast("success", t("toast.flatDeleted"));
            navigate("/company/properties");
        } catch (err) {
            addToast("error", t("toast.flatDeleteFailed"));
        }
    };

    if (loading) {
        return (
            <RoleGuard allowedRole="company">
                <Navbar />
                <div className="flex mt-20">
                    <CompanySidebar />
                    <main className="flex-1 p-6"><div className="animate-pulse h-96 bg-foreground/5 rounded-xl" /></main>
                </div>
            </RoleGuard>
        );
    }

    if (!house) {
        return (
            <RoleGuard allowedRole="company">
                <Navbar />
                <div className="flex mt-20">
                    <CompanySidebar />
                    <main className="flex-1 p-6 text-center text-foreground/50">{t("houses.notFound")}</main>
                </div>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRole="company">
            <Navbar />
            <div className="flex mt-20">
                <CompanySidebar />
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="font-serif text-2xl font-bold">{t("common.edit")}: {house.title}</h1>
                        <Button variant="ghost" onClick={() => setShowDelete(true)}>
                            <span className="text-red-500">{t("common.delete")}</span>
                        </Button>
                    </div>
                    <HouseForm house={house} onSubmit={handleSubmit} submitting={submitting} />
                </main>
            </div>

            {showDelete && (
                <ConfirmDialog
                    title={t("common.delete")}
                    message="Are you sure you want to delete this house? This cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                />
            )}
        </RoleGuard>
    );
}
