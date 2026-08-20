import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { clients } from "../drizzle/schema";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const testUser = {
  id: 1,
  openId: "ai3rmnjk2kjabvxJd3vWDV",
  name: "Mspa Maza",
  email: "mspa.maza@gmail.com",
  loginMethod: "google",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const marker = `__verification_client_${Date.now()}__`;
let createdId: number | undefined;

afterEach(async () => {
  if (!createdId) return;
  const database = await getDb();
  await database?.delete(clients).where(and(eq(clients.id, createdId), eq(clients.userId, testUser.id)));
});

describe("clients.create end-to-end", () => {
  it("persists and returns the authoritative server client row without leaving verification data", async () => {
    const ctx = { user: testUser } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const created = await caller.clients.create({ name: marker, email: "verification@example.com", address: null, phone: null, taxId: null });
    createdId = created.id;

    expect(created).toMatchObject({ id: expect.any(Number), userId: testUser.id, name: marker, email: "verification@example.com" });
    const list = await caller.clients.list({ query: marker });
    expect(list).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id, name: marker, userId: testUser.id })]));
  });
});
