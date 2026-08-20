export const DASHBOARD_PERIODS = ["this_month", "last_month", "this_year"] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export function getDashboardPeriodRange(period: DashboardPeriod, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  if (period === "last_month") {
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1), label: "bulan lalu" };
  }
  if (period === "this_year") {
    return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1), label: "tahun ini" };
  }
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1), label: "bulan ini" };
}

export function isDateWithinRange(date: Date, start: Date, end: Date) {
  return date >= start && date < end;
}

