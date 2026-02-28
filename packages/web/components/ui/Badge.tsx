const variants = {
    available: "bg-green-100 text-green-700 border-green-200",
    reserved: "bg-orange-100 text-orange-700 border-orange-200",
    sold: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
    planning: "bg-blue-100 text-blue-700 border-blue-200",
    under_construction: "bg-orange-100 text-orange-700 border-orange-200",
    near_completion: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    upcoming: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-orange-100 text-orange-700 border-orange-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    requested: "bg-blue-100 text-blue-700 border-blue-200",
    expired: "bg-gray-100 text-gray-400 border-gray-200",
    accepted: "bg-green-100 text-green-700 border-green-200",
    withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
    detached: "bg-indigo-100 text-indigo-700 border-indigo-200",
    semi_detached: "bg-teal-100 text-teal-700 border-teal-200",
    villa: "bg-purple-100 text-purple-700 border-purple-200",
    townhouse: "bg-cyan-100 text-cyan-700 border-cyan-200",
    cottage: "bg-amber-100 text-amber-700 border-amber-200",
    flat: "bg-blue-100 text-blue-700 border-blue-200",
    house: "bg-indigo-100 text-indigo-700 border-indigo-200",
    default: "bg-gray-100 text-gray-700 border-gray-200",
} as const;

interface BadgeProps {
    variant?: keyof typeof variants;
    children: React.ReactNode;
    className?: string;
}

const Badge = ({ variant = "default", children, className = "" }: BadgeProps) => {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
