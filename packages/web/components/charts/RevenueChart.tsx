import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ChartContainer from "./ChartContainer";
import type { MonthlyRevenue } from "../../lib/revenue";

interface Props {
    data: MonthlyRevenue[];
    title?: string;
    loading?: boolean;
    currency?: string;
}

const RevenueChart = ({ data, title = "Revenue", loading, currency = "EUR" }: Props) => {
    if (!loading && data.length === 0) {
        return (
            <ChartContainer title={title}>
                <div className="h-48 flex items-center justify-center text-foreground/40 text-sm">
                    No revenue data yet
                </div>
            </ChartContainer>
        );
    }

    const formatted = data.map((d) => ({
        ...d,
        label: d.month.slice(5), // "MM" from "YYYY-MM"
    }));

    return (
        <ChartContainer title={title} loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={formatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-foreground)" opacity={0.1} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-foreground)" opacity={0.4} />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--color-foreground)" opacity={0.4} />
                    <Tooltip
                        formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{ borderRadius: 8, border: "2px solid var(--color-foreground)", opacity: 0.9 }}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default RevenueChart;
