import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { isValidPublicInvoiceId } from "../shared/publicInvoice";

const projectFile = (...parts: string[]) => readFileSync(resolve(process.cwd(), ...parts), "utf8");

function createPublicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("public invoice route safety", () => {
  it("rejects route placeholders before a public invoice query is enabled", () => {
    expect(isValidPublicInvoiceId(":publicId")).toBe(false);
    expect(isValidPublicInvoiceId("")).toBe(false);
    expect(isValidPublicInvoiceId("invoice public")).toBe(false);
    expect(isValidPublicInvoiceId("u4R91_a8C-0P")).toBe(true);

    const page = projectFile("client", "src", "pages", "PublicInvoice.tsx");
    expect(page).toContain("enabled: hasValidPublicId");
    expect(page).toContain("Tautan invoice tidak valid");
  });

  it("returns a serializable null response for a valid but unknown public invoice ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.publicInvoice.get({ publicId: "missingPublicInvoice999999" });
    expect(result).toBeNull();
    expect(JSON.parse(JSON.stringify(result))).toBeNull();
  }, 30_000);
});
