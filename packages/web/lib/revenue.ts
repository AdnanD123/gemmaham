import type { Reservation, Flat, House, Contractor } from "@gemmaham/shared";

export interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  revenue: number;
}

export interface CompanyRevenueData {
  total: number;
  monthly: MonthlyRevenue[];
  byType: { flat: number; house: number };
}

export interface ContractorRevenueData {
  total: number;
  monthly: MonthlyRevenue[];
}

export interface UserExpenseData {
  total: number;
  items: { title: string; price: number; date: string }[];
}

function toMonth(timestamp: any): string {
  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date();
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function deriveCompanyRevenue(
  reservations: Reservation[],
  flats: Flat[],
  houses: House[],
): CompanyRevenueData {
  const flatMap = new Map(flats.map((f) => [f.id, f]));
  const houseMap = new Map(houses.map((h) => [h.id, h]));
  const monthMap = new Map<string, number>();
  let total = 0;
  let flatRevenue = 0;
  let houseRevenue = 0;

  for (const r of reservations) {
    if (r.status !== "completed") continue;

    let price = 0;
    if (r.propertyType === "flat" && r.flatId) {
      price = flatMap.get(r.flatId)?.price ?? 0;
      flatRevenue += price;
    } else if (r.propertyType === "house" && r.houseId) {
      price = houseMap.get(r.houseId)?.price ?? 0;
      houseRevenue += price;
    }

    total += price;
    const month = toMonth(r.updatedAt);
    monthMap.set(month, (monthMap.get(month) ?? 0) + price);
  }

  const monthly = Array.from(monthMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { total, monthly, byType: { flat: flatRevenue, house: houseRevenue } };
}

export function deriveContractorRevenue(
  assignments: (Contractor & { buildingName: string })[],
): ContractorRevenueData {
  const monthMap = new Map<string, number>();
  let total = 0;

  for (const a of assignments) {
    if (a.status !== "completed" || !a.contractValue) continue;
    total += a.contractValue;
    const month = a.endDate ? toMonth(a.endDate) : toMonth(a.createdAt);
    monthMap.set(month, (monthMap.get(month) ?? 0) + a.contractValue);
  }

  const monthly = Array.from(monthMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { total, monthly };
}

export function deriveUserExpenses(
  reservations: Reservation[],
  flats: Flat[],
  houses: House[],
): UserExpenseData {
  const flatMap = new Map(flats.map((f) => [f.id, f]));
  const houseMap = new Map(houses.map((h) => [h.id, h]));
  let total = 0;
  const items: { title: string; price: number; date: string }[] = [];

  for (const r of reservations) {
    if (r.status !== "completed") continue;

    let price = 0;
    let title = "";
    if (r.propertyType === "flat" && r.flatId) {
      const flat = flatMap.get(r.flatId);
      price = flat?.price ?? 0;
      title = flat?.title ?? "Unknown Flat";
    } else if (r.propertyType === "house" && r.houseId) {
      const house = houseMap.get(r.houseId);
      price = house?.price ?? 0;
      title = house?.title ?? "Unknown House";
    }

    total += price;
    items.push({ title, price, date: toMonth(r.updatedAt) });
  }

  return { total, items };
}
