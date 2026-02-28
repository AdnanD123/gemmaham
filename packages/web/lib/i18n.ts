import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./i18n/en.json";
import bs from "./i18n/bs.json";
import de from "./i18n/de.json";

const STORAGE_KEY = "gemmaham-lang";

// Always init with "en" so server and client first-render match (no hydration mismatch).
// After hydration, detectAndApplyLanguage() switches to the user's saved language.
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            bs: { translation: bs },
            de: { translation: de },
        },
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

// Update html lang attribute on language change + persist to localStorage
if (typeof document !== "undefined") {
    i18n.on("languageChanged", (lng) => {
        document.documentElement.setAttribute("lang", lng);
        try { localStorage.setItem(STORAGE_KEY, lng); } catch {}
    });
}

/** Call this once after hydration (in a useEffect) to apply the saved language. */
export function detectAndApplyLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== i18n.language && ["en", "bs", "de"].includes(saved)) {
            i18n.changeLanguage(saved);
        }
    } catch {}
}

export default i18n;
