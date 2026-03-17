import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Mail, UserCog, Crown, Shield, User, Trash2, X } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import {
    getTeamMembers,
    getTeamInvites,
    createTeamInvite,
    cancelTeamInvite,
    removeTeamMember,
    updateTeamMemberRole,
} from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, TeamMember, TeamInvite, TeamMemberRole } from "@gemmaham/shared";

export default function CompanySettingsTeam() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<TeamMemberRole>("agent");
    const [sending, setSending] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const [m, inv] = await Promise.all([
                    getTeamMembers(auth.companyId!),
                    getTeamInvites(auth.companyId!),
                ]);
                setMembers(m);
                setInvites(inv);
            } catch (e) {
                console.error("Failed to load team data:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    const pendingInvites = invites.filter((i) => i.status === "pending");

    const handleSendInvite = async () => {
        if (!inviteEmail || !auth.companyId || !auth.user) return;
        setSending(true);
        try {
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await createTeamInvite({
                email: inviteEmail.toLowerCase(),
                companyId: auth.companyId,
                companyName: auth.user.displayName || "Company",
                role: inviteRole,
                token,
                status: "pending",
                invitedBy: auth.user.uid,
                inviterName: auth.user.displayName || auth.user.email || "",
                expiresAt,
            });

            const updated = await getTeamInvites(auth.companyId);
            setInvites(updated);
            setInviteEmail("");
            addToast("success", t("toast.inviteSent"));
        } catch (e) {
            console.error("Failed to send invite:", e);
            addToast("error", t("toast.inviteSendFailed"));
        } finally {
            setSending(false);
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await cancelTeamInvite(inviteId);
            setInvites((prev) => prev.map((i) => i.id === inviteId ? { ...i, status: "cancelled" as const } : i));
            addToast("success", t("toast.inviteCancelled"));
        } catch (e) {
            console.error("Failed to cancel invite:", e);
            addToast("error", t("toast.inviteCancelFailed"));
        }
    };

    const handleRemoveMember = async () => {
        if (!removeTarget || !auth.companyId) return;
        try {
            await removeTeamMember(auth.companyId, removeTarget.userId);
            setMembers((prev) => prev.filter((m) => m.userId !== removeTarget.userId));
            addToast("success", t("toast.memberRemoved"));
        } catch (e) {
            console.error("Failed to remove member:", e);
            addToast("error", t("toast.memberRemoveFailed"));
        } finally {
            setRemoveTarget(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: TeamMemberRole) => {
        if (!auth.companyId) return;
        try {
            await updateTeamMemberRole(auth.companyId, userId, newRole);
            setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m));
            addToast("success", t("toast.roleChanged"));
        } catch (e) {
            console.error("Failed to change role:", e);
            addToast("error", t("toast.roleChangeFailed"));
        }
    };

    const roleIcon = (role: TeamMemberRole) => {
        switch (role) {
            case "owner": return <Crown size={14} className="text-amber-500" />;
            case "manager": return <Shield size={14} className="text-blue-500" />;
            case "agent": return <User size={14} className="text-foreground/50" />;
        }
    };

    const roleLabel = (role: TeamMemberRole) => {
        switch (role) {
            case "owner": return t("team.roleOwner");
            case "manager": return t("team.roleManager");
            case "agent": return t("team.roleAgent");
        }
    };

    const roleOptions = [
        { value: "manager", label: t("team.roleManager") },
        { value: "agent", label: t("team.roleAgent") },
    ];

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
                <div className="home">
                    <div className="flex">
                        <main className="flex-1 p-6 max-w-5xl">
                            <div className="mb-8">
                                <h1 className="text-2xl font-serif font-bold">{t("team.title")}</h1>
                                <p className="text-foreground/50 mt-1">{t("team.description")}</p>
                            </div>

                            <ContentLoader loading={loading} skeleton={
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 rounded-2xl bg-foreground/4 animate-pulse" />
                                    ))}
                                </div>
                            }>
                                <div className="space-y-6">
                                    {/* Team Members */}
                                    <section>
                                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <UserCog size={18} />
                                            {t("team.members")}
                                        </h2>

                                        {members.length === 0 ? (
                                            <p className="text-foreground/50 text-sm py-4">{t("team.noMembers")}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {members.map((member) => {
                                                    const isCurrentUser = member.userId === auth.user?.uid;
                                                    const isOwner = member.role === "owner";

                                                    return (
                                                        <div
                                                            key={member.userId}
                                                            className="bg-surface rounded-2xl border border-foreground/6 p-5 flex items-center gap-4"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    {roleIcon(member.role)}
                                                                    <span className="font-medium text-sm">
                                                                        {member.displayName}
                                                                    </span>
                                                                    {isCurrentUser && (
                                                                        <span className="text-xs text-foreground/40">
                                                                            {t("team.you")}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <Mail size={12} className="text-foreground/40" />
                                                                    <span className="text-xs text-foreground/60">
                                                                        {member.email}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Badge variant={member.status === "active" ? "approved" : "default"}>
                                                                {roleLabel(member.role)}
                                                            </Badge>

                                                            {!isOwner && !isCurrentUser && (
                                                                <div className="flex items-center gap-2">
                                                                    <Select
                                                                        options={roleOptions}
                                                                        value={member.role}
                                                                        onChange={(e) =>
                                                                            handleRoleChange(
                                                                                member.userId,
                                                                                e.target.value as TeamMemberRole,
                                                                            )
                                                                        }
                                                                        className="!w-32 !py-1.5 text-xs"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRemoveTarget(member)}
                                                                        className="p-1.5 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                        title={t("team.removeMember")}
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>

                                    {/* Invite Form */}
                                    <section>
                                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Mail size={18} />
                                            {t("team.inviteMember")}
                                        </h2>
                                        <div className="bg-surface rounded-2xl border border-foreground/6 p-5">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="flex-1">
                                                    <Input
                                                        label={t("team.email")}
                                                        type="email"
                                                        placeholder={t("team.emailPlaceholder")}
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-40">
                                                    <Select
                                                        label={t("team.role")}
                                                        options={roleOptions}
                                                        value={inviteRole}
                                                        onChange={(e) => setInviteRole(e.target.value as TeamMemberRole)}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        onClick={handleSendInvite}
                                                        disabled={sending || !inviteEmail}
                                                    >
                                                        <Mail size={14} className="mr-1.5" />
                                                        {t("team.sendInvite")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Pending Invites */}
                                    <section>
                                        <h2 className="text-lg font-semibold mb-3">{t("team.pendingInvites")}</h2>
                                        {pendingInvites.length === 0 ? (
                                            <p className="text-foreground/50 text-sm py-4">{t("team.noPendingInvites")}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {pendingInvites.map((invite) => (
                                                    <div
                                                        key={invite.id}
                                                        className="bg-surface rounded-2xl border border-foreground/6 p-5 flex items-center gap-4"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Mail size={14} className="text-foreground/40" />
                                                                <span className="text-sm font-medium">{invite.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <Badge variant="default">{roleLabel(invite.role)}</Badge>
                                                                <span className="text-xs text-foreground/40">
                                                                    {t("team.inviteExpires")}:{" "}
                                                                    {new Date(invite.expiresAt as string | number).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelInvite(invite.id)}
                                                            className="p-1.5 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title={t("team.cancelInvite")}
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </ContentLoader>
                        </main>
                    </div>
                </div>

                {/* Remove Member Confirm */}
                <ConfirmDialog
                    isOpen={!!removeTarget}
                    onClose={() => setRemoveTarget(null)}
                    onConfirm={handleRemoveMember}
                    title={t("team.removeMember")}
                    message={t("team.removeConfirm")}
                />
            </PageTransition>
        </RoleGuard>
    );
}
