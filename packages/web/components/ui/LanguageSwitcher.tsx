import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const languages = [
    { code: "en", label: "EN" },
    { code: "bs", label: "BS" },
    { code: "de", label: "DE" },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="relative flex items-center">
            <Globe size={14} className="absolute left-2 text-foreground/40 pointer-events-none" />
            <select
                value={i18n.language?.substring(0, 2) || "en"}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                aria-label="Change language"
                className="appearance-none text-xs font-medium text-foreground/60 hover:text-foreground pl-7 pr-2 py-1.5 rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 transition-colors bg-surface/80 backdrop-blur-xl min-h-[44px]"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
