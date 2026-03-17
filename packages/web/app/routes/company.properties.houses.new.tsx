import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import RoleGuard from "../../components/RoleGuard";
import HouseForm from "../../components/HouseForm";
import { createHouse, updateHouse } from "../../lib/firestore";
import { uploadHouseCover, uploadHouseFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, HouseType, AreaUnit } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function CompanyAddHouse() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (
        data: any,
        coverFile: File | null,
        floorPlanFile: File | null,
        photos?: string[],
    ) => {
        if (!auth.companyId) return;
        setSubmitting(true);
        try {
            const houseId = await createHouse({
                companyId: auth.companyId,
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
                coverImageUrl: null,
                floorPlanUrl: "",
                renderedImageUrl: null,
                photos: photos || [],
                status: "available",
                featured: data.featured,
            });

            // Upload images
            if (coverFile) {
                const url = await uploadHouseCover(auth.companyId, houseId, coverFile);
                await updateHouse(houseId, { coverImageUrl: url });
            }
            if (floorPlanFile) {
                const url = await uploadHouseFloorPlan(auth.companyId, houseId, floorPlanFile);
                await updateHouse(houseId, { floorPlanUrl: url });
            }

            addToast("success", t("toast.changesSaved"));
            navigate("/company/properties");
        } catch (err) {
            addToast("error", t("toast.saveFailed"));
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="flex">
                <main className="flex-1 p-6 max-w-3xl">
                    <h1 className="font-serif text-2xl font-bold mb-6">{t("houses.create")}</h1>
                    <HouseForm onSubmit={handleSubmit} submitting={submitting} />
                </main>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
