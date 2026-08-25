import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(resolve(process.cwd(), "client", "src", "pages", "InvoiceList.tsx"), "utf8");

describe("mobile invoice list layout", () => {
  it("keeps reporting actions compact and makes the primary invoice action full-width on a phone", () => {
    const page = source();

    expect(page).toContain('className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap"');
    expect(page).toContain('className="order-first col-span-2 h-12 w-full justify-center gap-2 sm:h-10 sm:w-auto"');
  });

  it("renders explicit labels for status, client, and date filters", () => {
    const page = source();

    expect(page).toContain("Tanggal mulai");
    expect(page).toContain("Tanggal akhir");
    expect(page).toContain('className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_200px_160px_160px]"');
  });

  it("uses invoice cards on a phone while preserving the full table from the md breakpoint", () => {
    const page = source();

    expect(page).toContain('className="divide-y divide-slate-100 md:hidden"');
    expect(page).toContain('className="hidden overflow-x-auto md:block"');
    expect(page).toContain("Jumlah tagihan");
    expect(page).toContain("aria-label={`Lihat ${invoice.invoiceNumber}`}");
  });
});

