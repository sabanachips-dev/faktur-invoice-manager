import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(resolve(process.cwd(), "client/src/components/InvoiceDocument.tsx"), "utf8");

describe("professional compact A4 invoice template", () => {
  it("keeps the full invoice information hierarchy in the compact document", () => {
    expect(component).toContain("Dari");
    expect(component).toContain("Ditagihkan kepada");
    expect(component).toContain("Kirim ke");
    expect(component).toContain("Informasi pembayaran");
    expect(component).toContain("Subtotal");
    expect(component).toContain("copyLabel || \"Faktur Asli\"");
  });

  it("uses the same document structure with compact spacing and readable metadata", () => {
    expect(component).toContain("invoice-paper--compact");
    expect(component).toContain("line-clamp-2");
    expect(component).toContain("formatDate(invoice.dueDate)");
    expect(component).toContain("business.bankAccountNumber");
  });
});
