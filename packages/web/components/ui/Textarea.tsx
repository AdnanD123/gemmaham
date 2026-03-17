import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = ({ label, error, className = "", ...props }: TextareaProps) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium">{label}</label>
            )}
            <textarea
                className={`w-full px-4 py-3 border-2 border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors resize-y min-h-[100px] ${error ? "border-red-400" : ""} ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default Textarea;
