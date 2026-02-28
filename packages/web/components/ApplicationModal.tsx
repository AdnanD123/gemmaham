import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import { createApplication } from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import type { Building, ContractorProfile } from "@gemmaham/shared";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    building: Building | null;
    contractor: ContractorProfile;
    onSuccess: () => void;
}

export default function ApplicationModal({ isOpen, onClose, building, contractor, onSuccess }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [message, setMessage] = useState("");
    const [proposedRate, setProposedRate] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!building) return;
        setSubmitting(true);
        try {
            await createApplication({
                buildingId: building.id,
                companyId: building.companyId,
                contractorUserId: contractor.id,
                contractorName: contractor.displayName,
                contractorCompanyName: contractor.companyName,
                contractorSpecialty: contractor.specialty,
                contractorCategories: contractor.categories || [],
                contractorLogoUrl: contractor.logoUrl,
                message,
                specialty: contractor.specialty,
                proposedRate: proposedRate ? Number(proposedRate) : null,
                currency,
            });
            addToast("success", t("applications.submitSuccess"));
            setMessage("");
            setProposedRate("");
            onSuccess();
            onClose();
        } catch (e) {
            console.error("Failed to submit application:", e);
            addToast("error", t("applications.submitFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!building) return null;

    const currencyOptions = [
        { value: "EUR", label: "EUR" },
        { value: "BAM", label: "BAM" },
        { value: "USD", label: "USD" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("applications.applyToProject")}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-foreground/5 rounded-lg">
                    <p className="text-sm font-medium">{building.title}</p>
                    <p className="text-xs text-foreground/50">{building.address}</p>
                </div>

                <Textarea
                    label={t("applications.messageLabel")}
                    placeholder={t("applications.messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />

                {/* Contractor categories (read-only) */}
                {contractor.categories && contractor.categories.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("contractorCategories.label")}</label>
                        <div className="flex flex-wrap gap-1">
                            {contractor.categories.map((cat) => (
                                <Badge key={cat.category} variant="default">
                                    {t(`contractorCategories.categories.${cat.category}`)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t("applications.proposedRate")}
                        type="number"
                        placeholder={t("applications.optional")}
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        min="0"
                    />
                    <Select
                        label={t("applications.currency")}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        options={currencyOptions}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={submitting}>
                        {submitting ? t("common.processing") : t("applications.submitApplication")}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
