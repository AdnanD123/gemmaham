// Re-export types from shared package for global availability
// Most types are now in @gemmaham/shared — import them explicitly.
// This file only keeps UI-specific ambient types that don't belong in the shared package.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

type AuthRequiredModalProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
};
