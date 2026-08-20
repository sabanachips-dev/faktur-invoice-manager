import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { navigateBack } from "../client/src/lib/navigation";

const projectFile = (...parts: string[]) => readFileSync(resolve(process.cwd(), ...parts), "utf8");

describe("invoice workflow navigation contract", () => {
  it("keeps the shared back action available on every non-dashboard workspace route", () => {
    const layout = projectFile("client", "src", "components", "DashboardLayout.tsx");
    expect(layout).toContain('location !== "/"');
    expect(layout).toContain("Kembali");
    expect(layout).toContain("navigateBack");

    const events: string[] = [];
    expect(navigateBack({ historyLength: 3, fallbackPath: "/", goToHistory: () => events.push("history"), goToFallback: path => events.push(path) })).toBe("history");
    expect(events).toEqual(["history"]);
    expect(navigateBack({ historyLength: 1, fallbackPath: "/", goToHistory: () => events.push("history"), goToFallback: path => events.push(path) })).toBe("fallback");
    expect(events).toEqual(["history", "/"]);
  });

  it("renders workflow steppers in the invoice editor, bulk invoice, and import flows", () => {
    const component = projectFile("client", "src", "components", "WorkflowStepper.tsx");
    expect(component).toContain('aria-label="Progres alur kerja"');
    expect(component).toContain("currentStep");
    expect(component).toContain('aria-current={active ? "step" : undefined}');
    expect(component).toContain("langkah saat ini");

    for (const file of ["InvoiceEditor.tsx", "BulkInvoice.tsx", "ImportInvoices.tsx"]) {
      const page = projectFile("client", "src", "pages", file);
      expect(page).toContain('import WorkflowStepper from "@/components/WorkflowStepper"');
      expect(page).toContain("<WorkflowStepper");
      expect(page).toContain("workflowStep");
    }
  });

  it("wraps every target invoice flow in the protected shell with the shared back action", () => {
    const app = projectFile("client", "src", "App.tsx");
    expect(app).toContain("function ProtectedPage");
    for (const route of ["/invoice/new", "/invoice/bulk", "/invoice/import", "/invoice/history", "/invoice/:id/preview"]) {
      expect(app).toContain(`path=\"${route}\" component={() => <ProtectedPage`);
    }
  });

  it("offers a fallback back action on the public invoice page", () => {
    const page = projectFile("client", "src", "pages", "PublicInvoice.tsx");
    expect(page).toContain("const goBack");
    expect(page).toContain("navigateBack");
    expect(page).toContain('fallbackPath: "/"');
    expect(page).toContain("Kembali");
  });
});
