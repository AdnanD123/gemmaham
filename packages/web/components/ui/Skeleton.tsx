interface SkeletonProps {
    className?: string;
}

const shimmerClass = "relative overflow-hidden bg-foreground/10 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent";

export function SkeletonLine({ className = "" }: SkeletonProps) {
    return <div className={`h-4 rounded ${shimmerClass} ${className}`} />;
}

export function SkeletonBlock({ className = "" }: SkeletonProps) {
    return <div className={`rounded-xl ${shimmerClass} ${className}`} />;
}

export function SkeletonCircle({ className = "" }: SkeletonProps) {
    return <div className={`rounded-full ${shimmerClass} ${className}`} />;
}
