import { SkeletonLine, SkeletonCircle } from "../ui/Skeleton";

function ConversationItemSkeleton() {
    return (
        <div className="p-4 bg-surface rounded-2xl border border-foreground/6 flex items-center gap-3">
            <SkeletonCircle className="w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
                <SkeletonLine className="w-32 h-4" />
                <SkeletonLine className="w-48 h-3" />
            </div>
            <SkeletonLine className="w-12 h-3" />
        </div>
    );
}

export function ConversationListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ConversationItemSkeleton key={i} />
            ))}
        </div>
    );
}

export function MessageThreadSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[false, true, false, true, false].map((isRight, i) => (
                <div key={i} className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
                    <div className={`space-y-1 ${isRight ? "items-end" : "items-start"}`}>
                        <SkeletonLine className={`h-10 rounded-xl ${isRight ? "w-48" : "w-56"}`} />
                        <SkeletonLine className="w-12 h-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
