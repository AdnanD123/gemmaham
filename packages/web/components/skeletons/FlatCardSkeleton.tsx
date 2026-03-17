import { SkeletonBlock, SkeletonLine } from "../ui/Skeleton";

export function FlatCardSkeleton() {
    return (
        <div className="bg-surface rounded-2xl overflow-hidden border border-foreground/6">
            <SkeletonBlock className="aspect-4/3 rounded-none" />
            <div className="p-5 space-y-3">
                <SkeletonLine className="w-3/4 h-5" />
                <SkeletonLine className="w-1/2 h-3" />
                <SkeletonLine className="w-1/3 h-6" />
            </div>
        </div>
    );
}

export function FlatGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <FlatCardSkeleton key={i} />
            ))}
        </div>
    );
}
