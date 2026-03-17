import { useEffect } from "react";
import { useOutletContext, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useToast } from "../lib/contexts/ToastContext";
import type { AuthContext, UserRole } from "@gemmaham/shared";

const EMAIL_VERIFICATION_REQUIRED = import.meta.env.VITE_EMAIL_VERIFICATION === "true";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRole: UserRole | UserRole[];
    redirectTo?: string;
}

export default function RoleGuard({ children, allowedRole, redirectTo = "/" }: RoleGuardProps) {
    const { user, role, loading, profileCompleted } = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const { t } = useTranslation();

    const allowed = !loading && user && role
        ? (Array.isArray(allowedRole) ? allowedRole.includes(role) : role === allowedRole)
        : true;

    useEffect(() => {
        if (!loading && user && profileCompleted && !allowed) {
            addToast("error", t("errors.noPermission"));
        }
    }, [loading, user, profileCompleted, allowed]);

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

    if (EMAIL_VERIFICATION_REQUIRED && !user.emailVerified) {
        return <Navigate to="/auth/verify-email" replace />;
    }

    if (!profileCompleted) {
        return <Navigate to="/profile/setup" replace />;
    }

    if (!allowed) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
