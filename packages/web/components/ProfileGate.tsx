import { useOutletContext, Navigate, useLocation } from "react-router";
import type { AuthContext } from "@gemmaham/shared";

const EXEMPT_PATHS = ["/auth/login", "/auth/register", "/profile/setup"];

export default function ProfileGate({ children }: { children: React.ReactNode }) {
    const { user, profileCompleted, loading } = useOutletContext<AuthContext>();
    const location = useLocation();

    if (loading) return <>{children}</>;
    if (!user) return <>{children}</>;

    const isExempt = EXEMPT_PATHS.some((p) => location.pathname.startsWith(p));
    if (isExempt) return <>{children}</>;

    if (!profileCompleted) {
        return <Navigate to="/profile/setup" replace />;
    }

    return <>{children}</>;
}
