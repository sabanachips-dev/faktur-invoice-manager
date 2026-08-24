import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

export type WorkerEnv = { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string };
export type WorkerUser = { id: number; authUserId: string; openId: string; name: string | null; email: string | null; role: "admin" | "user" };
export type WorkerContext = { user: WorkerUser | null; env: WorkerEnv };

async function getUser(request: Request, env: WorkerEnv): Promise<WorkerUser | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const baseHeaders = { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization };
  const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: baseHeaders });
  if (!authResponse.ok) return null;
  const authUser = await authResponse.json<{ id: string }>();
  const profileResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/users?authUserId=eq.${encodeURIComponent(authUser.id)}&select=id,authUserId,openId,name,email,role&limit=1`, { headers: baseHeaders });
  if (!profileResponse.ok) return null;
  const [profile] = await profileResponse.json<WorkerUser[]>();
  return profile ?? null;
}

const t = initTRPC.context<WorkerContext>().create({ transformer: superjson });
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});

export const workerRouter = t.router({
  auth: t.router({
    me: t.procedure.query(({ ctx }) => ctx.user),
    session: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id, email: ctx.user.email, name: ctx.user.name })),
  }),
});

export type WorkerRouter = typeof workerRouter;

export function handleTrpcRequest(request: Request, env: WorkerEnv) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: workerRouter,
    createContext: async () => ({ env, user: await getUser(request, env) }),
    onError({ error }) { console.error("[Worker tRPC]", error.code, error.message); },
  });
}
