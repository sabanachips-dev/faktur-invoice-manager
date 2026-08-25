import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("route code splitting", () => {
  it("defers operational invoice routes and document-heavy public invoice UI", () => {
    for (const page of ["InvoiceEditor", "BulkInvoice", "ImportInvoices", "InvoicePreview", "InvoiceList", "PublicInvoice"]) {
      expect(app).toContain(`const ${page} = lazy(() => import("@/pages/${page}"))`);
    }
    expect(app).toContain("<Suspense fallback={<PageLoading />}>");
    expect(app).toContain('role="status"');
  });

  it("keeps dashboard available at the first protected route", () => {
    expect(app).toContain('import Dashboard from "@/pages/Dashboard"');
    expect(app).toContain('<ProtectedPage><Dashboard /></ProtectedPage>');
  });
});
