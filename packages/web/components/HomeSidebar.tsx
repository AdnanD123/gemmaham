import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
    LayoutDashboard,
    Search,
    CalendarCheck,
    MessageSquare,
    UserCircle,
    ClipboardList,
    ClipboardCheck,
    ChevronLeft,
    ChevronRight,
    LogIn,
    UserPlus,
    Briefcase,
    Building2,
    Home,
    Users,
    UserCog,
    Heart,
    DollarSign,
} from "lucide-react";
import type { AuthContext } from "@gemmaham/shared";

interface HomeSidebarProps {
    auth: AuthContext;
    collapsed: boolean;
    onToggle: () => void;
}

export default function HomeSidebar({ auth, collapsed, onToggle }: HomeSidebarProps) {
    const { t } = useTranslation();
    const { pathname } = useLocation();

    const userLinks = [
        { to: "/user/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/properties", label: t("nav.browseProperties"), icon: Search },
        { to: "/user/favorites", label: t("nav.favorites"), icon: Heart },
        { to: "/user/reservations", label: t("nav.reservations"), icon: CalendarCheck },
        { to: "/user/requests", label: t("nav.myRequests"), icon: ClipboardList },
        { to: "/user/messages", label: t("nav.messages"), icon: MessageSquare },
        { to: "/user/profile", label: t("profile.myProfile"), icon: UserCircle },
    ];

    const companyLinks = [
        { to: "/company/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/company/buildings", label: t("nav.myBuildings"), icon: Building2 },
        { to: "/company/properties", label: t("nav.properties"), icon: Home },
        { to: "/company/contractors", label: t("nav.findContractors"), icon: Users },
        { to: "/company/reservations", label: t("nav.reservations"), icon: CalendarCheck },
        { to: "/company/requests", label: t("nav.requests"), icon: ClipboardCheck },
        { to: "/company/messages", label: t("nav.messages"), icon: MessageSquare },
        { to: "/company/finances", label: t("nav.finances"), icon: DollarSign },
    ];

    const contractorLinks = [
        { to: "/contractor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/contractor/browse", label: t("nav.browseProjects"), icon: Search },
        { to: "/contractor/applications", label: t("nav.myApplications"), icon: ClipboardList },
        { to: "/contractor/projects", label: t("nav.myProjects"), icon: Briefcase },
        { to: "/contractor/messages", label: t("nav.messages"), icon: MessageSquare },
        { to: "/contractor/finances", label: t("nav.finances"), icon: DollarSign },
        { to: "/contractor/profile", label: t("nav.profile"), icon: UserCog },
    ];

    const guestLinks = [
        { to: "/auth/login", label: t("nav.logIn"), icon: LogIn },
        { to: "/auth/register", label: t("nav.getStarted"), icon: UserPlus },
    ];

    const links = auth.loading
        ? []
        : auth.role === "company" ? companyLinks
        : auth.role === "contractor" ? contractorLinks
        : auth.user ? userLinks
        : guestLinks;

    return (
        <aside
            className={`fixed left-0 top-14 h-[calc(100vh-56px)] z-40 flex flex-col transition-all duration-300 overflow-visible ${
                collapsed ? "w-[52px]" : "w-56"
            }`}
            style={{
                background: "var(--color-glass)",
                backdropFilter: "blur(20px) saturate(1.8)",
                WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                borderRight: "1px solid var(--color-glass-border)",
            }}
        >
            {/* Toggle */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center w-full h-9 text-foreground/25 hover:text-foreground/60 transition-colors shrink-0"
                style={{ borderBottom: "1px solid var(--color-glass-border)" }}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {/* Links */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-visible">
                {auth.loading && (
                    <div className="space-y-1.5 px-1">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 rounded-xl bg-foreground/4 animate-pulse w-full" />
                        ))}
                    </div>
                )}
                {links.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                    return (
                        <div key={to} className="relative group">
                            <Link
                                to={to}
                                className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                                    collapsed ? "justify-center px-0" : ""
                                } ${
                                    active
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground/45 hover:text-foreground/80 hover:bg-foreground/4"
                                }`}
                            >
                                {active && (
                                    <span
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary"
                                        style={{ marginLeft: "-8px" }}
                                    />
                                )}
                                <Icon size={17} className="shrink-0" strokeWidth={active ? 2 : 1.6} />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                            {collapsed && (
                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                    <div
                                        className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-elevated"
                                        style={{
                                            background: "var(--color-foreground)",
                                            color: "var(--color-background)",
                                        }}
                                    >
                                        {label}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
