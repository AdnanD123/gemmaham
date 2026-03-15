import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { useTranslation } from "react-i18next";

import { useEffect, useState, useCallback } from "react";
import type { Route } from "./+types/root";
import "./app.css";
import "../lib/i18n";
import { detectAndApplyLanguage } from "../lib/i18n";
import { useAuth } from "../lib/hooks/useAuth";
import { ToastProvider } from "../lib/contexts/ToastContext";
import ToastContainer from "../components/ui/Toast";
import HomeSidebar from "../components/HomeSidebar";

// These routes don't need a sidebar
const NO_SIDEBAR_PREFIXES = ["/auth/", "/profile/", "/visualizer/"];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const themeScript = `(function(){try{var t=localStorage.getItem("gemmaham-theme")||"light";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const showSidebar = !NO_SIDEBAR_PREFIXES.some((p) => location.pathname.startsWith(p));

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("home-sidebar-collapsed") === "true";
  });

  const handleToggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("home-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  // After hydration, switch to user's saved language (avoids SSR mismatch)
  useEffect(() => {
    detectAndApplyLanguage();
  }, []);

  return (
    <ToastProvider>
      <main className="min-h-screen bg-background text-foreground relative z-10">
        {showSidebar && (
          <HomeSidebar auth={auth} collapsed={collapsed} onToggle={handleToggle} />
        )}
        <div
          className={`transition-all duration-300 ${
            showSidebar ? (collapsed ? "pl-14" : "pl-56") : ""
          }`}
        >
          <Outlet context={auth} />
        </div>
      </main>
      <ToastContainer />
    </ToastProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let status = 500;
  let title = t("errors.somethingWrong");
  let details = t("errors.unexpectedError");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? t("errors.pageNotFound") : `Error ${error.status}`;
    details =
      error.status === 404
        ? t("errors.pageNotFoundDesc")
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <p className="text-[8rem] md:text-[12rem] font-serif font-bold leading-none text-foreground/10 select-none">
        {status}
      </p>
      <h1 className="text-2xl md:text-3xl font-bold mb-3 -mt-6">{title}</h1>
      <p className="text-foreground/50 max-w-md mb-8">{details}</p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-bold uppercase tracking-wide bg-primary text-white hover:bg-[#ea580c] transition-colors"
      >
        {t("common.goHome")}
      </a>
      {stack && (
        <pre className="mt-8 w-full max-w-2xl p-4 overflow-x-auto text-left text-xs bg-surface rounded-xl border-2 border-foreground/10">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
