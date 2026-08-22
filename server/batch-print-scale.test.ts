import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printStyles = readFileSync(resolve(process.cwd(), "client/src/lib/printInvoice.ts"), "utf8");
const dialog = readFileSync(resolve(process.cwd(), "client/src/components/BatchPrintDialog.tsx"), "utf8");

describe("stable A4 two-up print layout", () => {
  it("locks two native-width compact invoices inside a safe static A4 print area without horizontal scaling", () => {
    expect(printStyles).toContain("position: absolute");
    expect(printStyles).toContain("height: 128mm");
    expect(printStyles).toContain("top: 137mm");
    expect(printStyles).toContain("height: 270mm");
    expect(printStyles).toContain("max-height: 270mm");
    expect(printStyles).toContain("width: 100%");
    expect(printStyles).not.toContain("width: 200%");
    expect(printStyles).not.toContain("transform: scale(.5)");
    expect(printStyles).toContain("break-inside: avoid");
    expect(printStyles).toContain(".batch-page:not(:last-child)");
  });

  it("renders a compact invoice only for two-up regions and preserves full pages as the fallback", () => {
    expect(dialog).toContain("<InvoiceDocument data={data} copyLabel={copyLabel} compact={page.mode === \"compact\"}");
    expect(dialog).toContain("dua panel ringkas aman pada A4");
    expect(dialog).toContain("Tiga item atau lebih memakai halaman penuh");
    expect(dialog).toContain("halaman penuh dipakai untuk invoice tiga item atau lebih");
  });

  it("opens two-up A4 in a dedicated print window with one static A4 sheet per batch page", () => {
    expect(printStyles).toContain("function printTwoUpInDedicatedWindow()");
    expect(printStyles).toContain("window.open(\"\", \"_blank\"");
    expect(printStyles).toContain(".dedicated-print-sheet--two");
    expect(printStyles).toContain("grid-template-rows: 128mm 128mm");
    expect(printStyles).toContain("dedicated-print-document:first-child::after");
    expect(printStyles).toContain("invoice-paper--compact");
    expect(printStyles).toContain("height: 128mm");
    expect(printStyles).toContain("margin: 10mm");
    expect(printStyles).toContain("width: 190mm");
    expect(printStyles).toContain('paperSize === "a4" && layout === "two" && printTwoUpInDedicatedWindow()');
  });

});
