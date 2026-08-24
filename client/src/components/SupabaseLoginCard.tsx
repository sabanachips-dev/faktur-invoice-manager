import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export function SupabaseLoginCard() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"password" | "magic" | "google" | null>(null);

  const run = async (kind: NonNullable<typeof pending>, action: () => Promise<{ error: { message: string } | null }>) => {
    setPending(kind); setError(null); setNotice(null);
    const { error: actionError } = await action();
    if (actionError) setError(actionError.message);
    setPending(null);
  };

  const signInWithPassword = async (event: FormEvent) => {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    if (mode === "signup") {
      await run("password", async () => {
        const result = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (!result.error) setNotice("Akun dibuat. Periksa email Anda bila konfirmasi email diaktifkan.");
        return result;
      });
      return;
    }
    await run("password", () => client.auth.signInWithPassword({ email, password }));
  };

  const sendMagicLink = async () => {
    const client = supabase;
    if (!client) return;
    await run("magic", async () => {
      const result = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (!result.error) setNotice("Tautan masuk telah dikirim. Periksa email Anda.");
      return result;
    });
  };

  const signInWithGoogle = async () => {
    const client = supabase;
    if (!client) return;
    await run("google", () => client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }));
  };

  if (!isSupabaseConfigured) {
    return <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm"><h1 className="text-xl font-bold">Konfigurasi login belum siap</h1><p className="mt-2 text-sm text-muted-foreground">Build staging membutuhkan URL dan publishable key Supabase.</p></div>;
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-left shadow-sm">
      <div className="mb-6 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">F</div><h1 className="text-2xl font-bold tracking-tight">{mode === "signup" ? "Buat akun Faktur" : "Masuk ke Faktur"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun bisnis Anda untuk mengelola invoice dan klien.</p></div>
      <form className="space-y-4" onSubmit={signInWithPassword}>
        {mode === "signup" && <div className="space-y-2"><Label htmlFor="auth-name">Nama</Label><Input id="auth-name" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} placeholder="Nama pemilik bisnis" /></div>}
        <div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="nama@bisnis.com" /></div>
        <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Password Anda" /></div>
        <Button className="w-full" type="submit" disabled={pending !== null}>{pending === "password" && <Loader2 className="mr-2 size-4 animate-spin" />}{mode === "signup" ? "Buat akun dengan password" : "Masuk dengan password"}</Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
      <div className="grid gap-3"><Button variant="outline" className="w-full" disabled={!email || pending !== null} onClick={sendMagicLink}>{pending === "magic" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}Kirim magic link</Button><Button variant="outline" className="w-full" disabled={pending !== null} onClick={signInWithGoogle}>{pending === "google" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}Lanjut dengan Google</Button></div>
      {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <button className="mt-5 w-full text-center text-xs font-medium text-primary hover:underline" type="button" onClick={() => { setMode(current => current === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}>
        {mode === "signup" ? "Sudah punya akun? Masuk" : "Belum punya akun? Buat akun"}
      </button>
    </div>
  );
}
