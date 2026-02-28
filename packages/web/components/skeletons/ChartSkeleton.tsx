const ChartSkeleton = () => {
    return (
        <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10">
            <div className="h-4 w-32 bg-foreground/10 rounded mb-4 animate-pulse" />
            <div className="h-48 bg-foreground/5 rounded-lg animate-pulse" />
        </div>
    );
};

export default ChartSkeleton;
