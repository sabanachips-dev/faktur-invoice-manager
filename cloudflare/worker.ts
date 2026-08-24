import { handleTrpcRequest } from "./trpc-router";

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const supabase = await fetch(`${env.SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
      });

      return json(
        {
          status: supabase.ok ? "ok" : "degraded",
          services: { supabase: supabase.ok },
        },
        supabase.ok ? 200 : 503,
      );
    }

    if (url.pathname === "/api/auth/me") {
      const authorization = request.headers.get("authorization");
      if (!authorization?.startsWith("Bearer ")) {
        return json({ error: "Sesi diperlukan." }, 401);
      }
      const upstream = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization },
      });
      if (!upstream.ok) return json({ error: "Sesi tidak valid." }, 401);
      const user = await upstream.json<{ id: string; email?: string; user_metadata?: { full_name?: string } }>();
      return json({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Pemilik bisnis",
      });
    }

    if (url.pathname === "/api/trpc" || url.pathname.startsWith("/api/trpc/")) {
      return handleTrpcRequest(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route is not available in the staging worker." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
