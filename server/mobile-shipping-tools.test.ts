import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = () => readFileSync(resolve(process.cwd(), "client", "src", "pages", "ShippingTools.tsx"), "utf8");

describe("mobile shipping tools layout", () => {
  it("keeps the rate and tracking cards in one column before the xl breakpoint", () => {
    const source = pageSource();

    expect(source).toContain('className="grid gap-4 sm:gap-6 xl:grid-cols-[1.2fr_.8fr]"');
    expect(source).toContain('className="p-4 sm:p-7"');
  });

  it("uses full-width mobile inputs and primary actions while preserving desktop sizing", () => {
    const source = pageSource();

    expect(source).toContain('className="h-12 w-full gap-2 sm:w-auto sm:px-5"');
    expect(source).toContain('className="mt-5 h-12 w-full gap-2 sm:mt-6 sm:h-11"');
    expect(source).toContain('className="h-12 rounded-xl border-slate-200 bg-white pr-10 text-base shadow-sm sm:text-sm"');
  });

  it("keeps selection, weight, and quote result content from overflowing on narrow screens", () => {
    const source = pageSource();

    expect(source).toContain('className="flex flex-col items-start gap-2.5 rounded-xl border border-emerald-200');
    expect(source).toContain('className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5"');
    expect(source).toContain('className="h-12 min-w-0 border-0 text-base shadow-none focus-visible:ring-0"');
    expect(source).toContain('className="shrink-0 whitespace-nowrap text-sm font-bold text-slate-950 sm:text-base"');
  });
});

