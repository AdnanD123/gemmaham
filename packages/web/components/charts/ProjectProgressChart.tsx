import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ChartContainer from "./ChartContainer";

interface ProjectProgress {
    name: string;
    progress: number;
    status: string;
}

interface Props {
    data: ProjectProgress[];
    title?: string;
    loading?: boolean;
}

const ProjectProgressChart = ({ data, title = "Project Progress", loading }: Props) => {
    if (!loading && data.length === 0) {
        return (
            <ChartContainer title={title}>
                <div className="h-48 flex items-center justify-center text-foreground/40 text-sm">
                    No project data yet
                </div>
            </ChartContainer>
        );
    }

    return (
        <ChartContainer title={title} loading={loading}>
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-foreground)" opacity={0.1} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-foreground)" opacity={0.4} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="var(--color-foreground)" opacity={0.4} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Progress"]} />
                    <Bar dataKey="progress" fill="#5856d6" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default ProjectProgressChart;
