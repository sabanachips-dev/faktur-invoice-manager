import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateThermalPageHeightMm } from "../client/src/lib/printInvoice";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("mobile invoice print layouts", () => {
  it("prints a cloned invoice host so surrounding application layout cannot create extra pages", () => {
    const source = read("client/src/lib/printInvoice.ts");

    expect(source).toContain('host.id = "invoice-print-host"');
    expect(source).toContain("host.appendChild(source.cloneNode(true))");
    expect(source).toContain("body > :not(#invoice-print-host) { display: none !important; }");
    expect(source).toContain("break-inside: avoid !important");
  });

  it("keeps a compact A4 print rule for the normal invoice without clipping other paper sizes", () => {
    const source = read("client/src/lib/printInvoice.ts");

    expect(source).toContain('paperSize === "a4" && documentId === "invoice-document"');
    expect(source).toContain("padding: 7mm 9mm !important");
    expect(source).toContain("padding-top: 1.8mm !important");
  });

  it("renders a dedicated portable template and exposes it from invoice preview", () => {
    const printRules = read("client/src/lib/printInvoice.ts");
    const portable = read("client/src/components/PortableInvoiceDocument.tsx");
    const preview = read("client/src/pages/InvoicePreview.tsx");

    expect(printRules).toContain('receipt58: { page: "58mm", margin: "0", documentWidth: "58mm", documentPadding: "0" }');
    expect(printRules).toContain('receipt80: { page: "80mm", margin: "0", documentWidth: "80mm", documentPadding: "0" }');
    expect(printRules).toContain('const thermalPaperWidth = paperSize === "receipt58" ? "58mm" : "80mm"');
    expect(printRules).toContain('const thermalDocumentWidth = paperSize === "receipt58" ? "52mm" : "74mm"');
    expect(printRules).toContain("thermalDocument.scrollHeight");
    expect(printRules).toContain("@page { size: ${isThermal && thermalPageHeightMm ? `${thermalPaperWidth} ${thermalPageHeightMm}mm` : rule.page}; margin: ${rule.margin}; }");
    expect(portable).toContain('id={documentId}');
    expect(portable).toContain('w-[74mm]');
    expect(preview).toContain('printInvoice("receipt58", "invoice-portable")');
    expect(preview).toContain('printInvoice("receipt80", "invoice-portable")');
    expect(preview).toContain("Rol 58 mm");
    expect(preview).toContain("Rol 80 mm");
  });

  it("calculates a bounded physical thermal height from the rendered document content", () => {
    expect(calculateThermalPageHeightMm(0)).toBe(90);
    expect(calculateThermalPageHeightMm(378)).toBe(109);
    expect(calculateThermalPageHeightMm(100_000)).toBe(1_200);
  });
});
