import { SkeletonBlock, SkeletonLine } from "../ui/Skeleton";

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <SkeletonLine className="w-48 h-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-surface rounded-xl border-2 border-foreground/10 space-y-3">
                        <SkeletonLine className="w-24 h-3" />
                        <SkeletonBlock className="w-16 h-10" />
                    </div>
                ))}
            </div>
        </div>
    );
}
