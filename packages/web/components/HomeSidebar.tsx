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
    ];

    const contractorLinks = [
        { to: "/contractor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/contractor/browse", label: t("nav.browseProjects"), icon: Search },
        { to: "/contractor/projects", label: t("nav.myProjects"), icon: Briefcase },
        { to: "/contractor/messages", label: t("nav.messages"), icon: MessageSquare },
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
            className={`fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col border-r-2 border-foreground/5 bg-background transition-all duration-300 overflow-visible ${
                collapsed ? "w-14" : "w-56"
            }`}
        >
            {/* Toggle button */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center w-full h-10 border-b-2 border-foreground/5 text-foreground/40 hover:text-foreground hover:bg-surface transition-colors shrink-0"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Links */}
            <nav className="flex-1 p-2 space-y-1 overflow-visible">
                {auth.loading && (
                    <div className="space-y-1 mt-1">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-9 rounded-lg bg-foreground/5 animate-pulse ${collapsed ? "w-full" : "w-full"}`} />
                        ))}
                    </div>
                )}
                {links.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                    return (
                        <div key={to} className="relative group">
                            <Link
                                to={to}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    collapsed ? "justify-center" : ""
                                } ${
                                    active
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-foreground/60 hover:bg-surface hover:text-foreground"
                                }`}
                            >
                                <Icon size={18} className="shrink-0" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                            {collapsed && (
                                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                                    <div className="bg-foreground text-background text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap">
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
