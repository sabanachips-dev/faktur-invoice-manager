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

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route is not available in the staging worker." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
