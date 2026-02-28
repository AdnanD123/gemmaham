import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartContainer from "./ChartContainer";

interface OccupancyData {
    label: string;
    value: number;
    color: string;
}

interface Props {
    data: OccupancyData[];
    title?: string;
    loading?: boolean;
}

const OccupancyChart = ({ data, title = "Occupancy", loading }: Props) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (!loading && total === 0) {
        return (
            <ChartContainer title={title}>
                <div className="h-48 flex items-center justify-center text-foreground/40 text-sm">
                    No property data yet
                </div>
            </ChartContainer>
        );
    }

    return (
        <ChartContainer title={title} loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        strokeWidth={2}
                        stroke="var(--color-background)"
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Units"]} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default OccupancyChart;
