import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    linkTo?: string;
}

const StatCard = ({ icon: Icon, value, label, linkTo }: StatCardProps) => {
    const content = (
        <div className="p-4 bg-surface rounded-2xl border border-foreground/6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/8">
                    <Icon size={20} className="text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-foreground/50">{label}</p>
                </div>
            </div>
        </div>
    );

    if (linkTo) {
        return <Link to={linkTo}>{content}</Link>;
    }
    return content;
};

export default StatCard;
