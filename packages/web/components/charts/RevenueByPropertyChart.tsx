import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartContainer from "./ChartContainer";

interface Props {
    flatRevenue: number;
    houseRevenue: number;
    title?: string;
    loading?: boolean;
    currency?: string;
}

const COLORS = ["#3b82f6", "#8b5cf6"];

const RevenueByPropertyChart = ({ flatRevenue, houseRevenue, title = "Revenue by Property", loading, currency = "EUR" }: Props) => {
    const total = flatRevenue + houseRevenue;

    if (!loading && total === 0) {
        return (
            <ChartContainer title={title}>
                <div className="h-48 flex items-center justify-center text-foreground/40 text-sm">
                    No revenue data yet
                </div>
            </ChartContainer>
        );
    }

    const data = [
        { name: "Flats", value: flatRevenue },
        { name: "Houses", value: houseRevenue },
    ].filter((d) => d.value > 0);

    return (
        <ChartContainer title={title} loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        strokeWidth={2}
                        stroke="var(--color-background)"
                    >
                        {data.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, "Revenue"]} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default RevenueByPropertyChart;
