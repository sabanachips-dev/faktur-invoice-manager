import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createClient: vi.fn(),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import { reconcileCreatedClient } from "../client/src/lib/clientCache";

describe("clients.create", () => {
  it("returns the complete authoritative client row after saving", async () => {
    const serverClient = {
      id: 41, userId: 1, name: "PT Cepat", email: "admin@cepat.id", address: null, phone: null, taxId: null,
      createdAt: new Date("2026-08-20T00:00:00Z"), updatedAt: new Date("2026-08-20T00:00:00Z"),
    };
    vi.mocked(db.createClient).mockResolvedValue(serverClient);
    const ctx = {
      user: { id: 1, openId: "user-1", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    } as TrpcContext;
    const result = await appRouter.createCaller(ctx).clients.create({ name: "PT Cepat", email: "admin@cepat.id", address: null, phone: null, taxId: null });
    expect(db.createClient).toHaveBeenCalledWith(1, expect.objectContaining({ name: "PT Cepat", email: "admin@cepat.id" }));
    expect(result).toEqual(serverClient);
  });

  it("replaces temporary client cache with the complete server row", () => {
    const authoritative = { id: 41, name: "PT Cepat", createdAt: new Date("2026-08-20") };
    const result = reconcileCreatedClient([{ id: -100, name: "PT Cepat", createdAt: new Date(0) }], -100, authoritative);
    expect(result).toEqual([authoritative]);
  });
});
