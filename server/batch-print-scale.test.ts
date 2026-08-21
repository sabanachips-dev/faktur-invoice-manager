import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printStyles = readFileSync(resolve(process.cwd(), "client/src/lib/printInvoice.ts"), "utf8");
const dialog = readFileSync(resolve(process.cwd(), "client/src/components/BatchPrintDialog.tsx"), "utf8");

describe("stable A4 two-up print layout", () => {
  it("locks two native-width compact invoices to physical A4 positions without horizontal scaling", () => {
    expect(printStyles).toContain("position: absolute");
    expect(printStyles).toContain("height: 136.5mm");
    expect(printStyles).toContain("top: 140.5mm");
    expect(printStyles).toContain("height: 277mm");
    expect(printStyles).toContain("width: 100%");
    expect(printStyles).not.toContain("width: 200%");
    expect(printStyles).not.toContain("transform: scale(.5)");
    expect(printStyles).toContain("break-inside: avoid");
    expect(printStyles).toContain(".batch-page:not(:last-child)");
  });

  it("renders a native compact invoice document for each two-up region", () => {
    expect(dialog).toContain("<InvoiceDocument data={data} copyLabel={copyLabel} compact={page.mode === \"compact\"}");
    expect(dialog).toContain("dua invoice ringkas native pada A4");
  });

});
