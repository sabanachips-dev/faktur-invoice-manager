import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(resolve(process.cwd(), "client/src/components/InvoiceDocument.tsx"), "utf8");

describe("professional compact A4 invoice template", () => {
  it("keeps the professional information hierarchy in the compact document", () => {
    expect(component).toContain("Ditagihkan kepada");
    expect(component).toContain("Total tagihan");
    expect(component).toContain("Item / Layanan");
    expect(component).toContain("copyLabel || \"Faktur Asli\"");
  });

  it("uses a contained two-up card design with compact metadata and notes", () => {
    expect(component).toContain("invoice-paper--compact");
    expect(component).toContain("rounded-[3mm]");
    expect(component).toContain("line-clamp-2");
    expect(component).toContain("formatDate(invoice.dueDate)");
  });
});
