import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printStyles = readFileSync(resolve(process.cwd(), "client/src/lib/printInvoice.ts"), "utf8");
const dialog = readFileSync(resolve(process.cwd(), "client/src/components/BatchPrintDialog.tsx"), "utf8");

describe("stable A4 two-up print layout", () => {
  it("uses two native-width compact invoice regions instead of horizontally expanding a scaled document", () => {
    expect(printStyles).toContain("grid-template-rows: minmax(0, 1fr) minmax(0, 1fr)");
    expect(printStyles).toContain("height: 277mm");
    expect(printStyles).toContain("width: 100%");
    expect(printStyles).not.toContain("width: 200%");
    expect(printStyles).not.toContain("transform: scale(.5)");
    expect(printStyles).toContain("break-inside: avoid");
  });

  it("renders a native compact invoice document for each two-up region", () => {
    expect(dialog).toContain("<InvoiceDocument data={data} copyLabel={copyLabel} compact={page.mode === \"compact\"}");
    expect(dialog).toContain("dua invoice ringkas native pada A4");
  });

});
