import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./ui/Button";
import type { Contractor } from "@gemmaham/shared";

type Assignment = Contractor & { buildingName: string };

interface Props {
    assignments: Assignment[];
    onSelect: (buildingId: string) => void;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function getStartPadding(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday=0 to Monday-first: Mon=0, Tue=1, ..., Sun=6
    return day === 0 ? 6 : day - 1;
}

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    if (typeof value === "string") return new Date(value);
    if (typeof value === "object" && value !== null && "toDate" in value) {
        return (value as { toDate: () => Date }).toDate();
    }
    return null;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
    const d = date.getTime();
    // Normalize to start of day
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return d >= s && d <= e;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    in_progress: { bg: "bg-amber-500/20", text: "text-amber-700 dark:text-amber-400" },
    upcoming: { bg: "bg-primary/15", text: "text-primary" },
    completed: { bg: "bg-green-500/20", text: "text-green-700 dark:text-green-400" },
};

export default function ContractorCalendar({ assignments, onSelect }: Props) {
    const { t } = useTranslation();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
    const padding = useMemo(() => getStartPadding(year, month), [year, month]);

    const assignmentsWithDates = useMemo(
        () =>
            assignments
                .map((a) => ({
                    ...a,
                    _start: parseDate(a.startDate),
                    _end: parseDate(a.endDate),
                }))
                .filter((a) => a._start && a._end) as (Assignment & { _start: Date; _end: Date })[],
        [assignments],
    );

    const getAssignmentsForDay = (date: Date) =>
        assignmentsWithDates.filter((a) => isWithinRange(date, a._start, a._end));

    const prevMonth = () => {
        if (month === 0) { setYear((y) => y - 1); setMonth(11); }
        else setMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setYear((y) => y + 1); setMonth(0); }
        else setMonth((m) => m + 1);
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    };

    const monthName = new Date(year, month).toLocaleString(undefined, { month: "long", year: "numeric" });

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-lg font-semibold min-w-[180px] text-center capitalize">{monthName}</h2>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <Button size="sm" variant="ghost" onClick={goToday}>
                    {t("contractor.calendarToday")}
                </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d} className="text-xs font-medium text-foreground/40 text-center py-2">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-t border-l border-foreground/6">
                {/* Padding cells */}
                {Array.from({ length: padding }, (_, i) => (
                    <div key={`pad-${i}`} className="min-h-[80px] border-r border-b border-foreground/6 bg-foreground/2" />
                ))}

                {/* Day cells */}
                {days.map((date) => {
                    const dayAssignments = getAssignmentsForDay(date);
                    const isToday = isSameDay(date, today);

                    return (
                        <div
                            key={date.getDate()}
                            className={`min-h-[80px] border-r border-b border-foreground/6 p-1 ${
                                isToday ? "bg-primary/5" : ""
                            }`}
                        >
                            <div className={`text-xs font-medium mb-1 ${
                                isToday ? "text-primary font-bold" : "text-foreground/50"
                            }`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {dayAssignments.slice(0, 3).map((a) => {
                                    const colors = STATUS_COLORS[a.status] || STATUS_COLORS.upcoming;
                                    return (
                                        <button
                                            key={a.id}
                                            onClick={() => onSelect(a.buildingId)}
                                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
                                            title={`${a.buildingName} — ${a.trade}`}
                                        >
                                            {a.buildingName}
                                        </button>
                                    );
                                })}
                                {dayAssignments.length > 3 && (
                                    <div className="text-[10px] text-foreground/40 px-1">
                                        +{dayAssignments.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
