import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printStyles = readFileSync(resolve(process.cwd(), "client/src/lib/printInvoice.ts"), "utf8");
const dialog = readFileSync(resolve(process.cwd(), "client/src/components/BatchPrintDialog.tsx"), "utf8");

describe("stable A4 two-up print layout", () => {
  it("locks two native-width compact invoices inside a safe static A4 print area without horizontal scaling", () => {
    expect(printStyles).toContain("position: absolute");
    expect(printStyles).toContain("height: 132mm");
    expect(printStyles).toContain("top: 137mm");
    expect(printStyles).toContain("height: 270mm");
    expect(printStyles).toContain("max-height: 270mm");
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

  it("opens two-up A4 in a dedicated print window with one static A4 sheet per batch page", () => {
    expect(printStyles).toContain("function printTwoUpInDedicatedWindow()");
    expect(printStyles).toContain("window.open(\"\", \"_blank\"");
    expect(printStyles).toContain(".dedicated-print-sheet--two");
    expect(printStyles).toContain("grid-template-rows: 132mm 132mm");
    expect(printStyles).toContain("dedicated-print-document:first-child::after");
    expect(printStyles).toContain('paperSize === "a4" && layout === "two" && printTwoUpInDedicatedWindow()');
  });

});
