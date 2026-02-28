import { useOutletContext, Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import type { AuthContext, UserRole } from "@gemmaham/shared";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRole: UserRole | UserRole[];
    redirectTo?: string;
}

export default function RoleGuard({ children, allowedRole, redirectTo = "/" }: RoleGuardProps) {
    const { user, role, loading, profileCompleted } = useOutletContext<AuthContext>();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!profileCompleted) {
        return <Navigate to="/profile/setup" replace />;
    }

    const allowed = Array.isArray(allowedRole) ? allowedRole.includes(role!) : role === allowedRole;
    if (!allowed) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
