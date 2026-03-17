import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, ArrowLeft } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import Input from "./ui/Input";
import Badge from "./ui/Badge";
import { searchContractors, createContractorInvitation, createNotification } from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import type { ContractorProfile } from "@gemmaham/shared";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    buildingId: string;
    companyId: string;
    buildingTitle: string;
    companyName: string;
}

export default function InviteContractorModal({ isOpen, onClose, buildingId, companyId, buildingTitle, companyName }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [contractors, setContractors] = useState<ContractorProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(null);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        searchContractors({})
            .then(setContractors)
            .catch((e) => console.error("Failed to load contractors:", e))
            .finally(() => setLoading(false));
    }, [isOpen]);

    const filtered = searchQuery
        ? contractors.filter(
              (c) =>
                  c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : contractors;

    const handleSendInvitation = async () => {
        if (!selectedContractor) return;
        setSubmitting(true);
        try {
            await createContractorInvitation({
                buildingId,
                companyId,
                contractorId: selectedContractor.id,
                contractorName: selectedContractor.displayName,
                buildingTitle,
                companyName,
                message,
                status: "pending",
            });

            await createNotification(selectedContractor.id, {
                userId: selectedContractor.id,
                type: "contractor_invited",
                title: "New Invitation",
                message: `You have been invited to work on ${buildingTitle}`,
                linkTo: "/contractor/applications",
                read: false,
            });

            addToast("success", t("toast.invitationSent"));
            handleClose();
        } catch (e) {
            console.error("Failed to send invitation:", e);
            addToast("error", t("toast.invitationSendFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedContractor(null);
        setMessage("");
        setSearchQuery("");
        onClose();
    };

    const handleBack = () => {
        setSelectedContractor(null);
        setMessage("");
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t("invitations.inviteContractor")}>
            {selectedContractor ? (
                <div className="space-y-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {t("common.back")}
                    </button>

                    <div className="p-3 bg-foreground/5 rounded-lg">
                        <p className="text-sm font-medium">{selectedContractor.displayName}</p>
                        <p className="text-xs text-foreground/50">{selectedContractor.companyName}</p>
                        {selectedContractor.categories && selectedContractor.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedContractor.categories.map((cat) => (
                                    <Badge key={cat.category} variant="default">
                                        {t(`contractorCategories.categories.${cat.category}`)}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-foreground/5 rounded-lg">
                        <p className="text-xs text-foreground/50">{t("invitations.forBuilding")}</p>
                        <p className="text-sm font-medium">{buildingTitle}</p>
                    </div>

                    <Textarea
                        label={t("invitations.message")}
                        placeholder={t("invitations.messagePlaceholder")}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button onClick={handleSendInvitation} disabled={submitting}>
                            {submitting ? t("common.processing") : t("invitations.sendInvitation")}
                        </Button>
                        <Button variant="ghost" onClick={handleClose}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-foreground/50">{t("invitations.selectContractor")}</p>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                        <Input
                            placeholder={t("invitations.searchContractors")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {loading ? (
                            <div className="text-center py-6">
                                <p className="text-foreground/50 text-sm">{t("common.loading")}</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-foreground/50 text-sm">{t("invitations.noContractorsFound")}</p>
                            </div>
                        ) : (
                            filtered.map((contractor) => (
                                <button
                                    key={contractor.id}
                                    onClick={() => setSelectedContractor(contractor)}
                                    className="w-full text-left p-3 rounded-lg border border-foreground/6 hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{contractor.displayName}</p>
                                            <p className="text-xs text-foreground/50">{contractor.companyName}</p>
                                        </div>
                                    </div>
                                    {contractor.categories && contractor.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {contractor.categories.map((cat) => (
                                                <Badge key={cat.category} variant="default">
                                                    {t(`contractorCategories.categories.${cat.category}`)}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
