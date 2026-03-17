import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

interface ContentLoaderProps {
    /** Whether data is still loading */
    loading: boolean;
    /** Skeleton placeholder shown while loading */
    skeleton: ReactNode;
    /** Actual content shown after loading */
    children: ReactNode;
    /** Optional className for the wrapper */
    className?: string;
}

/**
 * Standardized loading → content transition.
 * Shows skeleton with shimmer, then cross-fades to real content.
 *
 * Usage:
 * ```
 * <ContentLoader loading={loading} skeleton={<DashboardSkeleton />}>
 *   <ActualContent />
 * </ContentLoader>
 * ```
 */
export function ContentLoader({ loading, skeleton, children, className }: ContentLoaderProps) {
    return (
        <div className={className}>
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {skeleton}
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Inline loading indicator for smaller areas (buttons, cells, badges).
 * Shows a pulsing dot pattern while loading, then fades in content.
 */
export function InlineLoader({ loading, children, className = "" }: { loading: boolean; children: ReactNode; className?: string }) {
    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.span
                    key="dots"
                    className={`inline-flex items-center gap-1 ${className}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-pulse" style={{ animationDelay: "0.3s" }} />
                </motion.span>
            ) : (
                <motion.span
                    key="value"
                    className={className}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.span>
            )}
        </AnimatePresence>
    );
}
