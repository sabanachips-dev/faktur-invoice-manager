export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const response = await fetch(`${env.SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      return Response.json(
        {
          status: response.ok ? "ok" : "degraded",
          services: { supabase: response.ok },
        },
        {
          status: response.ok ? 200 : 503,
          headers: { "cache-control": "no-store" },
        },
      );
    }

    return new Response("Faktur staging Worker is online. API migration is in progress.", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
