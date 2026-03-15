import { useTranslation } from "react-i18next";
import { LayoutDashboard, CalendarCheck, ClipboardList, MessageSquare, Search, UserCircle } from "lucide-react";
import { Sidebar, type SidebarLink } from "./Sidebar";

const UserSidebar = () => {
    const { t } = useTranslation();

    const links: SidebarLink[] = [
        { to: "/user/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/properties", label: t("nav.browseProperties"), icon: Search, exact: true },
        { to: "/user/reservations", label: t("nav.reservations"), icon: CalendarCheck },
        { to: "/user/requests", label: t("nav.myRequests"), icon: ClipboardList },
        { to: "/user/messages", label: t("nav.messages"), icon: MessageSquare },
        { to: "/user/profile", label: t("profile.myProfile"), icon: UserCircle },
    ];

    return <Sidebar links={links} />;
};

export default UserSidebar;
