import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => readFileSync(resolve(process.cwd(), ...parts), "utf8");

describe("mobile invoice editor and dashboard recovery", () => {
  it("renders item cards on small screens while retaining the desktop table at md and above", () => {
    const editor = projectFile("client", "src", "pages", "InvoiceEditor.tsx");

    expect(editor).toContain("function MobileInvoiceItems");
    expect(editor).toContain('className="divide-y divide-slate-100 md:hidden"');
    expect(editor).toContain('className="hidden overflow-x-auto border-t md:block"');
    expect(editor).toContain("aria-label={`Hapus item ${itemNumber}`}");
    expect(editor).toContain("inputMode=\"numeric\"");
  });

  it("keeps the invoice progress visible without horizontal scrolling on a phone", () => {
    const stepper = projectFile("client", "src", "components", "WorkflowStepper.tsx");

    expect(stepper).toContain('className="grid grid-cols-3 gap-3 sm:flex sm:items-start sm:gap-4"');
    expect(stepper).not.toContain("overflow-x-auto");
  });

  it("offers a retry state instead of an indefinite Dashboard skeleton after a failed query", () => {
    const dashboard = projectFile("client", "src", "pages", "Dashboard.tsx");

    expect(dashboard).toContain("{ retry: 1 }");
    expect(dashboard).toContain("dashboard.isError");
    expect(dashboard).toContain("DashboardLoadError");
    expect(dashboard).toContain("dashboard.refetch()");
    expect(dashboard).toContain("Ringkasan belum dapat dimuat");
  });
});

