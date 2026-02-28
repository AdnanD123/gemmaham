import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Wrench, Check, X } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import type { ContractorApplication } from "@gemmaham/shared";

interface Props {
    application: ContractorApplication;
    onAccept: (application: ContractorApplication) => Promise<void>;
    onReject: (application: ContractorApplication, notes: string) => Promise<void>;
}

export default function ApplicationCard({ application, onAccept, onReject }: Props) {
    const { t } = useTranslation();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectNotes, setRejectNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleAccept = async () => {
        setProcessing(true);
        try {
            await onAccept(application);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await onReject(application, rejectNotes);
            setShowRejectForm(false);
            setRejectNotes("");
        } finally {
            setProcessing(false);
        }
    };

    const isPending = application.status === "pending";

    return (
        <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10">
            <div className="flex items-start gap-3">
                {application.contractorLogoUrl ? (
                    <img src={application.contractorLogoUrl} alt={application.contractorName} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Wrench size={18} className="text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link to={`/contractors/${application.contractorUserId}`} className="font-medium truncate text-primary hover:underline">
                            {application.contractorName}
                        </Link>
                        <Badge variant={application.status}>{t(`applications.status.${application.status}`)}</Badge>
                    </div>
                    <p className="text-xs text-foreground/50">{application.contractorCompanyName}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {application.contractorCategories && application.contractorCategories.length > 0 ? (
                            application.contractorCategories.slice(0, 3).map((cat) => (
                                <Badge key={cat.category} variant="default">
                                    {t(`contractorCategories.categories.${cat.category}`)}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant={application.contractorSpecialty as any}>
                                {t(`contractor.specialties.${application.contractorSpecialty}`)}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Message */}
            <div className="mt-3 p-3 bg-foreground/5 rounded-lg">
                <p className="text-sm text-foreground/70">{application.message}</p>
            </div>

            {/* Rate */}
            {application.proposedRate != null && (
                <p className="text-sm mt-2">
                    <span className="text-foreground/50">{t("applications.proposedRate")}:</span>{" "}
                    <span className="font-medium">{application.currency} {application.proposedRate.toLocaleString()}</span>
                </p>
            )}

            {/* Company notes (for rejected) */}
            {application.companyNotes && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <p className="text-xs text-foreground/50 mb-0.5">{t("applications.companyNotes")}:</p>
                    <p className="text-sm">{application.companyNotes}</p>
                </div>
            )}

            {/* Actions */}
            {isPending && !showRejectForm && (
                <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={handleAccept} disabled={processing}>
                        <Check size={14} className="mr-1" /> {t("applications.accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowRejectForm(true)} disabled={processing}>
                        <X size={14} className="mr-1" /> {t("applications.reject")}
                    </Button>
                </div>
            )}

            {/* Reject form */}
            {showRejectForm && (
                <div className="mt-4 space-y-3">
                    <Textarea
                        label={t("applications.rejectReason")}
                        placeholder={t("applications.rejectReasonPlaceholder")}
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleReject} disabled={processing}>
                            {processing ? t("common.processing") : t("applications.confirmReject")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
