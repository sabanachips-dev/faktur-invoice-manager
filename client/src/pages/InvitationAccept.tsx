import { SupabaseLoginCard } from "@/components/SupabaseLoginCard";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/_core/hooks/useSupabaseAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";

export default function InvitationAccept() {
  const [, params] = useRoute("/invite/:token");
  const [, navigate] = useLocation();
  const { loading, user } = useSupabaseAuth();
  const accept = trpc.organizations.acceptInvitation.useMutation();
  const token = params?.token || "";
  const acceptInvitation = () => accept.mutate({ token }, { onSuccess: () => navigate("/" ) });
  useEffect(() => { if (user && token && !accept.isPending && !accept.isSuccess && !accept.error) acceptInvitation(); }, [user, token, accept.isPending, accept.isSuccess, accept.error]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-muted-foreground"><Loader2 className="mr-2 inline size-4 animate-spin" />Memeriksa sesi…</div>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10"><div className="w-full max-w-md space-y-4"><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center"><UsersRound className="mx-auto size-7 text-primary" /><h1 className="mt-3 font-bold text-slate-950">Anda diundang ke ruang kerja</h1><p className="mt-1 text-sm leading-6 text-slate-600">Masuk atau buat akun dengan email yang menerima undangan ini. Setelah login, Faktur akan membuka undangan secara otomatis.</p></div><SupabaseLoginCard redirectTo={window.location.href} /></div></main>;
  if (accept.isError) return <main className="grid min-h-screen place-items-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm"><h1 className="font-bold text-slate-950">Undangan tidak dapat digunakan</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{accept.error.message}</p><Button className="mt-5" onClick={() => navigate("/")}>Buka Faktur</Button></div></main>;
  if (accept.isSuccess) return <main className="grid min-h-screen place-items-center bg-slate-50 px-5"><div className="max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm"><CheckCircle2 className="mx-auto size-10 text-emerald-600" /><h1 className="mt-3 font-bold text-slate-950">Anda sudah bergabung</h1><p className="mt-2 text-sm text-muted-foreground">Ruang kerja baru sedang dibuka.</p></div></main>;
  return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-muted-foreground"><Loader2 className="mr-2 inline size-4 animate-spin" />Memproses undangan…</div>;
}
