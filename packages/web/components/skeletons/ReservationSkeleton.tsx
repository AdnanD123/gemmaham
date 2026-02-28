import { SkeletonLine } from "../ui/Skeleton";

function ReservationItemSkeleton() {
    return (
        <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <SkeletonLine className="w-32 h-5" />
                    <SkeletonLine className="w-16 h-5 rounded-full" />
                </div>
                <SkeletonLine className="w-48 h-3" />
                <SkeletonLine className="w-20 h-3" />
            </div>
            <SkeletonLine className="w-16 h-8 rounded-lg" />
        </div>
    );
}

export default function ReservationListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ReservationItemSkeleton key={i} />
            ))}
        </div>
    );
}
