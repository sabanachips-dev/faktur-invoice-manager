import { describe, expect, it } from "vitest";
import { getDashboardPeriodRange, isDateWithinRange } from "../shared/dashboard";

describe("dashboard date ranges", () => {
  const reference = new Date(2026, 7, 20, 12, 0, 0);

  it("creates an inclusive August interval for this month", () => {
    const range = getDashboardPeriodRange("this_month", reference);
    expect(range.label).toBe("bulan ini");
    expect(range.start).toEqual(new Date(2026, 7, 1));
    expect(range.end).toEqual(new Date(2026, 8, 1));
    expect(isDateWithinRange(new Date(2026, 7, 31, 23, 59), range.start, range.end)).toBe(true);
    expect(isDateWithinRange(new Date(2026, 8, 1), range.start, range.end)).toBe(false);
  });

  it("returns the complete previous month and calendar year", () => {
    const lastMonth = getDashboardPeriodRange("last_month", reference);
    const thisYear = getDashboardPeriodRange("this_year", reference);
    expect(lastMonth.start).toEqual(new Date(2026, 6, 1));
    expect(lastMonth.end).toEqual(new Date(2026, 7, 1));
    expect(thisYear.start).toEqual(new Date(2026, 0, 1));
    expect(thisYear.end).toEqual(new Date(2027, 0, 1));
  });
});

