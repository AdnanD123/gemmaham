import { useTranslation } from "react-i18next";
import { LayoutDashboard, Search, Building2, MessageSquare, UserCog } from "lucide-react";
import { Sidebar, type SidebarLink } from "./Sidebar";

const ContractorSidebar = () => {
    const { t } = useTranslation();

    const links: SidebarLink[] = [
        { to: "/contractor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/contractor/browse", label: t("nav.browseProjects"), icon: Search },
        { to: "/contractor/projects", label: t("nav.myProjects"), icon: Building2 },
        { to: "/contractor/messages", label: t("nav.messages"), icon: MessageSquare },
        { to: "/contractor/profile", label: t("nav.profile"), icon: UserCog },
    ];

    return <Sidebar links={links} />;
};

export default ContractorSidebar;
