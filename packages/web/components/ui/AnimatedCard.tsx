import { motion } from "motion/react";
import { type ReactNode, useMemo } from "react";

interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    index?: number;
    hover?: boolean;
}

function usePrefersReducedMotion(): boolean {
    return useMemo(
        () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        [],
    );
}

export function AnimatedCard({ children, className, index = 0, hover = true }: AnimatedCardProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                ease: "easeOut",
                delay: index * 0.06,
            }}
            whileHover={hover ? {
                y: -3,
                boxShadow: "var(--shadow-card-hover)",
                transition: { duration: 0.15 },
            } : undefined}
            whileTap={hover ? {
                y: 0,
                transition: { duration: 0.1 },
            } : undefined}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function AnimatedGrid({ children, className }: { children: ReactNode; className?: string }) {
    const prefersReducedMotion = usePrefersReducedMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.06 },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
