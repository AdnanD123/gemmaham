import { useTranslation } from "react-i18next";
import { LayoutDashboard, Building2, Home, Users, CalendarCheck, ClipboardCheck, MessageSquare } from "lucide-react";
import { Sidebar, type SidebarLink } from "./Sidebar";

const CompanySidebar = () => {
    const { t } = useTranslation();

    const links: SidebarLink[] = [
        { to: "/company/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/company/buildings", label: t("nav.myBuildings"), icon: Building2 },
        { to: "/company/contractors", label: t("nav.findContractors"), icon: Users },
        { to: "/company/properties", label: t("nav.properties"), icon: Home },
        { to: "/company/reservations", label: t("nav.reservations"), icon: CalendarCheck },
        { to: "/company/requests", label: t("nav.requests"), icon: ClipboardCheck },
        { to: "/company/messages", label: t("nav.messages"), icon: MessageSquare },
    ];

    return <Sidebar links={links} />;
};

export default CompanySidebar;
