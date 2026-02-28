import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "gemmaham-theme";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
    if (typeof document === "undefined") return;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem(STORAGE_KEY, t);
        applyTheme(t);
    }, []);

    // Sync from localStorage after hydration
    useEffect(() => {
        const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || "light";
        setThemeState(stored);
        applyTheme(stored);
        setMounted(true);
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        if (!mounted || theme !== "system") return;

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme("system");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme, mounted]);

    const cycle = useCallback(() => {
        const order: Theme[] = ["light", "dark", "system"];
        const next = order[(order.indexOf(theme) + 1) % order.length];
        setTheme(next);
    }, [theme, setTheme]);

    return { theme, setTheme, cycle };
}
