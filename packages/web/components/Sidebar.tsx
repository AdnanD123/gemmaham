import { Link, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";

export interface SidebarLink {
    to: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
}

interface SidebarProps {
    links: SidebarLink[];
}

export const Sidebar = ({ links }: SidebarProps) => {
    const { pathname } = useLocation();

    return (
        <aside className="w-64 shrink-0 border-r-2 border-foreground/5 min-h-[calc(100vh-80px)] p-4 hidden lg:block">
            <nav className="space-y-1" aria-label="Sidebar">
                {links.map(({ to, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === to : pathname.startsWith(to);
                    return (
                        <Link
                            key={to}
                            to={to}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                active
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground/60 hover:bg-surface-highlight hover:text-foreground"
                            }`}
                        >
                            <Icon size={18} />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
