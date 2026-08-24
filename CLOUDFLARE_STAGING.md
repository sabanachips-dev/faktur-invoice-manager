# Cloudflare Staging Starter

This branch contains only the initial Cloudflare Worker shell. It serves the built React application and exposes `GET /api/health`, which validates that the Worker can reach Supabase with a publishable key. Existing tRPC, MySQL, Manus OAuth, and Manus Storage functions remain untouched on this branch until their staged replacements are implemented and tested.

## Local verification

Copy `.dev.vars.example` to `.dev.vars`, set the real `SUPABASE_PUBLISHABLE_KEY` locally, then run `pnpm run cf:dev`. The real key must be added as a Cloudflare Worker secret before remote deployment; it must never be placed in this repository or in `wrangler.jsonc`.

## Safety boundary

The Worker does not expose database tables or bypass RLS. It only uses the public key to call Supabase Auth settings for a health check. API migration, Supabase Auth, Storage, database schema, and DNS remain separate steps.

## Supabase Auth

The migration branch includes a Supabase login card supporting email/password sign-up and sign-in, magic links, and Google OAuth. Before exposing the login screen publicly, add the Worker URL and future custom domain to **Supabase Authentication → URL Configuration → Redirect URLs**.

Google OAuth must be enabled in **Supabase Authentication → Providers → Google**. Supply a Google OAuth Client ID and Client Secret there, and add Supabase's callback URL shown in that provider panel to the Google Cloud OAuth client. These Google credentials must stay in Supabase settings and must never be committed to this repository.
