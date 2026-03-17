import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Menu, LogOut } from "lucide-react";
import ThemeToggle from "./ui/ThemeToggle";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import MobileMenu from "./MobileMenu";
import { Link } from "react-router";
import type { AuthContext } from "@gemmaham/shared";

const Navbar = ({ auth }: { auth: AuthContext }) => {
    const { t } = useTranslation();
    const { user, role, signOut } = auth;
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error(`Sign out failed: ${e}`);
        }
    };

    const profileLink = role === "contractor" ? "/contractor/profile"
        : role === "user" ? "/user/profile"
        : role === "company" ? "/company/dashboard"
        : "/";

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
                    </div>

                    <div className="actions">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        {user ? (
                            <>
                                <NotificationBell userId={user.uid} />
                                <Link
                                    to={profileLink}
                                    className="greeting hidden md:inline hover:text-primary transition-colors"
                                >
                                    {user.displayName ? t("nav.hi", { name: user.displayName }) : "Signed in"}
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                                    title={t("nav.logOut")}
                                >
                                    <LogOut size={14} />
                                    <span className="hidden lg:inline">{t("nav.logOut")}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/auth/login"
                                    className="login hidden md:inline"
                                >
                                    {t("nav.logIn")}
                                </Link>

                                <Link to="/auth/register" className="cta hidden md:inline-flex">{t("nav.getStarted")}</Link>
                            </>
                        )}

                        <button
                            onClick={() => setMobileOpen(true)}
                            aria-label={t("common.menu")}
                            className="lg:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
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
