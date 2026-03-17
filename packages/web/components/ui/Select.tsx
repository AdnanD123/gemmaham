import { useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

const Select = ({ label, error, options, className = "", id: propId, ...props }: SelectProps) => {
    const autoId = useId();
    const id = propId || autoId;
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium">{label}</label>
            )}
            <select
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                className={`w-full px-4 py-3 border-2 border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors ${error ? "border-red-400" : ""} ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p id={errorId} className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default Select;
