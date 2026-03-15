import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Menu } from "lucide-react";
import Button from "./ui/Button";
import ThemeToggle from "./ui/ThemeToggle";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import MobileMenu from "./MobileMenu";
import { useOutletContext, Link } from "react-router";
import type { AuthContext } from "@gemmaham/shared";

const Navbar = () => {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { user, role, signOut } = auth;
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error(`Sign out failed: ${e}`);
        }
    };

    return (
        <>
            <header className="navbar">
                <nav className="inner" aria-label="Main navigation">
                    <div className="left">
                        <Link to="/" className="brand">
                            <Box className="logo" />
                            <span className="name">Gemmaham</span>
                            {import.meta.env.VITE_EMAIL_VERIFICATION !== "true" && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400 text-yellow-900 uppercase tracking-wide">test</span>
                            )}
                        </Link>

                        <ul className="links">
                            {(!role || role === "user") && (
                                <li><Link to="/properties">{t("nav.browseProperties")}</Link></li>
                            )}
                            {role === "company" && (
                                <>
                                    <li><Link to="/company/dashboard">{t("nav.dashboard")}</Link></li>
                                    <li><Link to="/company/contractors">{t("nav.findContractors")}</Link></li>
                                    <li><Link to="/company/properties">{t("nav.properties")}</Link></li>
                                    <li><Link to="/company/messages">{t("nav.messages")}</Link></li>
                                </>
                            )}
                            {role === "user" && (
                                <>
                                    <li><Link to="/user/reservations">{t("nav.reservations")}</Link></li>
                                    <li><Link to="/user/messages">{t("nav.messages")}</Link></li>
                                </>
                            )}
                            {role === "contractor" && (
                                <>
                                    <li><Link to="/contractor/dashboard">{t("nav.dashboard")}</Link></li>
                                    <li><Link to="/contractor/browse">{t("nav.browseProjects")}</Link></li>
                                    <li><Link to="/contractor/projects">{t("nav.myProjects")}</Link></li>
                                    <li><Link to="/contractor/messages">{t("nav.messages")}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="actions">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        {user ? (
                            <>
                                <NotificationBell userId={user.uid} />
                                <Link
                                    to={role === "contractor" ? "/contractor/profile" : role === "user" ? "/user/profile" : "/"}
                                    className="greeting hidden md:inline hover:text-primary transition-colors"
                                >
                                    {user.displayName ? t("nav.hi", { name: user.displayName }) : "Signed in"}
                                </Link>

                                <Button size="sm" onClick={handleSignOut} className="btn hidden md:inline-flex">
                                    {t("nav.logOut")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/auth/login" className="hidden md:inline">
                                    <Button size="sm" variant="ghost">{t("nav.logIn")}</Button>
                                </Link>

                                <Link to="/auth/register" className="cta hidden md:inline-flex">{t("nav.getStarted")}</Link>
                            </>
                        )}

                        <button
                            onClick={() => setMobileOpen(true)}
                            aria-label={t("common.menu")}
                            className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </nav>
            </header>

            <MobileMenu
                isOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                auth={auth}
                onSignOut={handleSignOut}
            />
        </>
    );
};

export default Navbar;
