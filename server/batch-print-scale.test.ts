import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printStyles = readFileSync(resolve(process.cwd(), "client/src/lib/printInvoice.ts"), "utf8");
const dialog = readFileSync(resolve(process.cwd(), "client/src/components/BatchPrintDialog.tsx"), "utf8");

describe("stable A4 two-up print scale", () => {
  it("scales the full invoice document uniformly into two fixed-height A4 regions", () => {
    expect(printStyles).toContain("height: 136.5mm");
    expect(printStyles).toContain("width: 200%");
    expect(printStyles).toContain("transform: scale(.5)");
    expect(printStyles).toContain("transform-origin: top left");
    expect(printStyles).toContain("break-inside: avoid");
  });

  it("isolates the print portal from the application shell so hidden UI cannot create blank pages", () => {
    expect(printStyles).toContain("body > :not(#invoice-batch-print) { display: none !important; }");
    expect(printStyles).not.toContain("body > * { visibility: hidden !important; }");
    expect(dialog).toContain("createPortal(batchPrintMarkup, document.body)");
  });

  it("renders the normal invoice document for two-up pages instead of a separate dense template", () => {
    expect(dialog).toContain("<InvoiceDocument data={data} copyLabel={copyLabel}");
    expect(dialog).not.toContain("compact={page.mode === \"compact\"}");
    expect(dialog).toContain("dua invoice utuh berskala 50%");
  });
});
