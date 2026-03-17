const variants = {
    // Status — success/positive
    available: "bg-secondary/10 text-secondary border-secondary/20",
    confirmed: "bg-secondary/10 text-secondary border-secondary/20",
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    approved: "bg-secondary/10 text-secondary border-secondary/20",
    accepted: "bg-secondary/10 text-secondary border-secondary/20",
    near_completion: "bg-secondary/10 text-secondary border-secondary/20",

    // Status — in progress/pending
    reserved: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-primary/10 text-primary border-primary/20",
    requested: "bg-primary/10 text-primary border-primary/20",
    under_construction: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-primary/10 text-primary border-primary/20",
    planning: "bg-primary/10 text-primary border-primary/20",
    upcoming: "bg-primary/10 text-primary border-primary/20",

    // Status — negative/error
    sold: "bg-accent/10 text-accent border-accent/20",
    rejected: "bg-accent/10 text-accent border-accent/20",
    cancelled: "bg-foreground/6 text-foreground/40 border-foreground/10",
    expired: "bg-foreground/6 text-foreground/35 border-foreground/10",
    withdrawn: "bg-foreground/6 text-foreground/40 border-foreground/10",

    // Property types
    detached: "bg-primary/8 text-primary/80 border-primary/15",
    semi_detached: "bg-secondary/8 text-secondary/80 border-secondary/15",
    villa: "bg-accent/8 text-accent/80 border-accent/15",
    townhouse: "bg-primary/8 text-primary/80 border-primary/15",
    cottage: "bg-secondary/8 text-secondary/80 border-secondary/15",
    flat: "bg-primary/8 text-primary/80 border-primary/15",
    house: "bg-primary/8 text-primary/80 border-primary/15",

    // Default
    default: "bg-foreground/6 text-foreground/60 border-foreground/10",
} as const;

interface BadgeProps {
    variant?: keyof typeof variants;
    children: React.ReactNode;
    className?: string;
}

const Badge = ({ variant = "default", children, className = "" }: BadgeProps) => {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold tracking-wide border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
