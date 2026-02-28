import { useOutletContext, Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import type { AuthContext } from "@gemmaham/shared";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, profileCompleted } = useOutletContext<AuthContext>();

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

    return <>{children}</>;
}
