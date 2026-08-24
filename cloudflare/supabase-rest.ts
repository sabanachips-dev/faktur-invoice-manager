import { TRPCError } from "@trpc/server";

export type SupabaseRestContext = {
  env: { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string };
  accessToken: string | null;
};

export async function supabaseRest<T>(ctx: SupabaseRestContext, path: string, init: RequestInit = {}): Promise<T> {
  if (!ctx.accessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });

  const headers = new Headers(init.headers);
  headers.set("apikey", ctx.env.SUPABASE_PUBLISHABLE_KEY);
  headers.set("authorization", ctx.accessToken);
  headers.set("accept", "application/json");
  if (init.body) headers.set("content-type", "application/json");

  const response = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
  if (!response.ok) {
    const detail = await response.json<{ message?: string; details?: string }>().catch(() => ({}));
    throw new TRPCError({
      code: response.status === 401 || response.status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
      message: detail.message || detail.details || "Operasi data tidak dapat diselesaikan.",
    });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function queryPath(table: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, value);
  return `${table}?${search.toString()}`;
}
