import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
    const portable = read("client/src/components/PortableInvoiceDocument.tsx");
    const preview = read("client/src/pages/InvoicePreview.tsx");

    expect(portable).toContain('id={documentId}');
    expect(portable).toContain('w-[74mm]');
    expect(preview).toContain('printInvoice("receipt80", "invoice-portable")');
    expect(preview).toContain("Template portable 80 mm");
  });
});

