import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "invoice-list-api-user",
      email: "invoice-list-api@example.com",
      name: "Invoice List API",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("invoices.list tRPC procedure", () => {
  it("returns a JSON-serializable invoice list for an authenticated caller", async () => {
    const caller = appRouter.createCaller(createAuthenticatedContext());
    const result = await caller.invoices.list({});
    const payload = JSON.parse(JSON.stringify(result));
    expect(Array.isArray(payload)).toBe(true);
    for (const row of payload) {
      expect(row).toHaveProperty("invoice");
      expect(row).toHaveProperty("client");
    }
  }, 30_000);
});
