import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "../../lib/hooks/useTheme";

const icons: Record<Theme, React.ReactNode> = {
    light: <Sun size={16} />,
    dark: <Moon size={16} />,
    system: <Monitor size={16} />,
};

export default function ThemeToggle() {
    const { t } = useTranslation();
    const { theme, cycle } = useTheme();

    const labels: Record<Theme, string> = {
        light: t("theme.light"),
        dark: t("theme.dark"),
        system: t("theme.system"),
    };

    return (
        <button
            onClick={cycle}
            className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/6 focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
            title={`${labels[theme]}`}
        >
            {icons[theme]}
        </button>
    );
}
