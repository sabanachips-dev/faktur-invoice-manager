import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(resolve(process.cwd(), "client", "src", "pages", "InvoicePreview.tsx"), "utf8");

describe("mobile quick invoice print", () => {
  it("opens the existing A4 print flow from a prominent quick-print action", () => {
    const page = source();

    expect(page).toContain('import { printInvoice } from "@/lib/printInvoice";');
    expect(page).toContain('printInvoice("a4")');
    expect(page).toContain("Cetak cepat");
  });

  it("keeps advanced batch printing and the PDF route available", () => {
    const page = source();

    expect(page).toContain("<BatchPrintDialog documents={[data]} />");
    expect(page).toContain("downloadInvoicePdf(documentRef.current, data.invoice.invoiceNumber)");
  });

  it("makes the quick-print action full-width before the desktop breakpoint", () => {
    const page = source();

    expect(page).toContain('className="order-first col-span-2 h-12 w-full justify-center gap-2 sm:h-9 sm:w-auto"');
  });
});
