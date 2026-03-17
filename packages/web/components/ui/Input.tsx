import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = ({ label, error, className = "", id: propId, ...props }: InputProps) => {
    const autoId = useId();
    const id = propId || autoId;
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium">{label}</label>
            )}
            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                className={`w-full px-4 py-3 border-2 border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors ${error ? "border-red-400" : ""} ${className}`}
                {...props}
            />
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default Input;
