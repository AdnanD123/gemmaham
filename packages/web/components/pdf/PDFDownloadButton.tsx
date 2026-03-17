import { useState, useEffect, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import Button from "../ui/Button";

interface Props {
    document: ReactElement;
    fileName: string;
    label: string;
}

export default function PDFDownloadButton({ document, fileName, label }: Props) {
    const { t } = useTranslation();
    const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<{
        document: ReactElement;
        fileName: string;
        children: (props: { loading: boolean; url: string | null; error: Error | null; blob: Blob | null }) => ReactElement;
    }> | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        import("@react-pdf/renderer").then((mod) => {
            setPDFDownloadLink(() => mod.PDFDownloadLink);
        });
    }, []);

    if (!PDFDownloadLink) {
        return (
            <Button size="sm" variant="ghost" disabled>
                <Download size={14} className="mr-1.5" />
                {label}
            </Button>
        );
    }

    return (
        <PDFDownloadLink document={document} fileName={fileName}>
            {({ loading }) => (
                <Button size="sm" variant="ghost" disabled={loading}>
                    <Download size={14} className="mr-1.5" />
                    {loading ? t("pdf.generating") : label}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
