import { motion } from "motion/react";
import { type ReactNode, useMemo } from "react";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    const prefersReducedMotion = useMemo(
        () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        [],
    );

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
