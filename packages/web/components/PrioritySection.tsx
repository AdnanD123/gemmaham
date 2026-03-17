import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Badge from "./ui/Badge";

type Priority = "in_progress" | "planned" | "completed";

const priorityConfig: Record<Priority, { label: string; variant: string }> = {
    in_progress: { label: "In Progress", variant: "in_progress" },
    planned: { label: "Planned", variant: "requested" },
    completed: { label: "Completed", variant: "completed" },
};

interface PrioritySectionProps {
    priority: Priority;
    count: number;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

const PrioritySection = ({ priority, count, children, defaultExpanded }: PrioritySectionProps) => {
    const expanded = defaultExpanded ?? priority !== "completed";
    const [isExpanded, setIsExpanded] = useState(expanded);
    const config = priorityConfig[priority];

    if (count === 0) return null;

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 mb-3 w-full text-left hover:bg-foreground/4 rounded-xl px-2 py-1 transition-colors"
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Badge variant={config.variant as any}>{config.label}</Badge>
                <span className="text-sm text-foreground/50">({count})</span>
            </button>
            {isExpanded && (
                <div className="space-y-3 pl-6">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PrioritySection;
