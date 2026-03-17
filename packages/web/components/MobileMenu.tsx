import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { X } from "lucide-react";
import Button from "./ui/Button";
import type { AuthContext } from "@gemmaham/shared";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    auth: AuthContext;
    onSignOut: () => void;
}

export default function MobileMenu({ isOpen, onClose, auth, onSignOut }: MobileMenuProps) {
    const { t } = useTranslation();
    const { user, role } = auth;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute right-0 top-0 h-full w-72 border-l border-foreground/6 shadow-xl animate-[slide-in_0.2s_ease-out]" style={{ background: "var(--color-glass)", backdropFilter: "blur(20px) saturate(1.8)" }}>
                <div className="flex items-center justify-between p-4 border-b border-foreground/6">
                    <span className="font-serif font-bold text-lg">{t("common.menu")}</span>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {(!role || role === "user") && (
                        <NavLink to="/properties" onClick={onClose}>{t("nav.browseProperties")}</NavLink>
                    )}

                    {role === "company" && (
                        <>
                            <NavLink to="/company/dashboard" onClick={onClose}>{t("nav.dashboard")}</NavLink>
                            <NavLink to="/company/buildings" onClick={onClose}>{t("nav.myBuildings")}</NavLink>
                            <NavLink to="/company/contractors" onClick={onClose}>{t("nav.findContractors")}</NavLink>
                            <NavLink to="/company/properties" onClick={onClose}>{t("nav.properties")}</NavLink>
                            <NavLink to="/company/reservations" onClick={onClose}>{t("nav.reservations")}</NavLink>
                            <NavLink to="/company/requests" onClick={onClose}>{t("nav.requests")}</NavLink>
                            <NavLink to="/company/messages" onClick={onClose}>{t("nav.messages")}</NavLink>
                        </>
                    )}

                    {role === "user" && (
                        <>
                            <NavLink to="/user/dashboard" onClick={onClose}>{t("nav.dashboard")}</NavLink>
                            <NavLink to="/user/reservations" onClick={onClose}>{t("nav.reservations")}</NavLink>
                            <NavLink to="/user/requests" onClick={onClose}>{t("nav.myRequests")}</NavLink>
                            <NavLink to="/user/messages" onClick={onClose}>{t("nav.messages")}</NavLink>
                        </>
                    )}

                    {role === "contractor" && (
                        <>
                            <NavLink to="/contractor/dashboard" onClick={onClose}>{t("nav.dashboard")}</NavLink>
                            <NavLink to="/contractor/browse" onClick={onClose}>{t("nav.browseProjects")}</NavLink>
                            <NavLink to="/contractor/projects" onClick={onClose}>{t("nav.myProjects")}</NavLink>
                            <NavLink to="/contractor/messages" onClick={onClose}>{t("nav.messages")}</NavLink>
                            <NavLink to="/contractor/profile" onClick={onClose}>{t("nav.profile")}</NavLink>
                        </>
                    )}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-foreground/6">
                    {user ? (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 truncate">
                                {user.displayName || user.email}
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => { onSignOut(); onClose(); }}
                            >
                                {t("nav.logOut")}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Link to="/auth/login" onClick={onClose}>
                                <Button size="sm" variant="ghost" className="w-full">{t("nav.logIn")}</Button>
                            </Link>
                            <Link to="/auth/register" onClick={onClose}>
                                <Button size="sm" className="w-full">{t("nav.getStarted")}</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NavLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
            {children}
        </Link>
    );
}
