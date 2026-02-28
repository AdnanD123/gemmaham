interface SkeletonProps {
    className?: string;
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
    return <div className={`h-4 bg-foreground/10 rounded animate-pulse ${className}`} />;
}

export function SkeletonBlock({ className = "" }: SkeletonProps) {
    return <div className={`bg-foreground/10 rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCircle({ className = "" }: SkeletonProps) {
    return <div className={`rounded-full bg-foreground/10 animate-pulse ${className}`} />;
}
