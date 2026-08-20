import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("invoice import file input accessibility", () => {
  it("keeps the native file input available to assistive technology and browser upload automation", () => {
    const page = readFileSync(resolve(process.cwd(), "client", "src", "pages", "ImportInvoices.tsx"), "utf8");
    expect(page).toContain('aria-label="Unggah file impor invoice"');
    expect(page).toContain('className="sr-only"');
    expect(page).not.toContain('className="hidden" type="file"');
  });
});
