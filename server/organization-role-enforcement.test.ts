import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const ownerContext: WorkerContext = {
  env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token",
  user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user", organizationId: 11, organizationRole: "owner" },
};
const staffContext: WorkerContext = { ...ownerContext, user: { ...ownerContext.user!, id: 8, organizationRole: "staff" } };
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });

describe("organization role enforcement", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects team role changes from staff before any database mutation", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(workerRouter.createCaller(staffContext).organizations.updateMemberRole({ memberId: 2, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prevents the owner from downgrading their own membership", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{ userId: 7 }])); vi.stubGlobal("fetch", fetchMock);
    await expect(workerRouter.createCaller(ownerContext).organizations.updateMemberRole({ memberId: 1, role: "staff" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a workspace that RLS cannot return as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([])));
    await expect(workerRouter.createCaller(staffContext).organizations.switch({ organizationId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
