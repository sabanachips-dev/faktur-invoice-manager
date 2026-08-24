import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settings = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");

describe("settings completeness reminder", () => {
  it("guides the owner when business email or bank account details are missing", () => {
    expect(settings).toContain("missingInvoiceDetails");
    expect(settings).toContain('"email bisnis"');
    expect(settings).toContain('"nomor rekening"');
    expect(settings).toContain("Siapkan invoice sebelum dibagikan");
    expect(settings).toContain('role="status"');
  });
});
