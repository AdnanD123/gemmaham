import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
}: ConfirmDialogProps) {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-foreground/60">{message}</p>
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={onConfirm} disabled={loading}>
                        {loading ? t("common.processing") : confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
