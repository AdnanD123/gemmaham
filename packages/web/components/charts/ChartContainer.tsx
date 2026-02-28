interface Props {
    title: string;
    subtitle?: string;
    loading?: boolean;
    children: React.ReactNode;
}

const ChartContainer = ({ title, subtitle, loading, children }: Props) => {
    return (
        <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10">
            <div className="mb-4">
                <h3 className="font-semibold">{title}</h3>
                {subtitle && <p className="text-xs text-foreground/50">{subtitle}</p>}
            </div>
            {loading ? (
                <div className="h-48 bg-foreground/5 rounded-lg animate-pulse" />
            ) : (
                children
            )}
        </div>
    );
};

export default ChartContainer;
