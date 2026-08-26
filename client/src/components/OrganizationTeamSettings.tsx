import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Copy, Loader2, Mail, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AssignableRole = "admin" | "staff";

const roleLabel = { owner: "Pemilik", admin: "Admin", staff: "Staf" } as const;
const roleTone = { owner: "bg-amber-50 text-amber-800 border-amber-200", admin: "bg-blue-50 text-blue-800 border-blue-200", staff: "bg-slate-100 text-slate-700 border-slate-200" } as const;

export function OrganizationTeamSettings() {
  const utils = trpc.useUtils();
  const current = trpc.organizations.current.useQuery();
  const workspaces = trpc.organizations.list.useQuery();
  const members = trpc.organizations.members.useQuery();
  const invitations = trpc.organizations.invitations.useQuery();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AssignableRole>("staff");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const role = current.data?.role;
  const canManageInvites = role === "owner" || role === "admin";
  const isOwner = role === "owner";
  const invalidateTeam = async () => {
    await Promise.all([utils.organizations.current.invalidate(), utils.organizations.list.invalidate(), utils.organizations.members.invalidate(), utils.organizations.invitations.invalidate()]);
  };
  const switchWorkspace = trpc.organizations.switch.useMutation({
    onSuccess: () => window.location.assign("/"),
    onError: error => toast.error(error.message),
  });
  const invite = trpc.organizations.invite.useMutation({
    onSuccess: async result => {
      setInviteUrl(result.inviteUrl); setEmail(""); await invalidateTeam(); toast.success("Tautan undangan siap dibagikan.");
    },
    onError: error => toast.error(error.message),
  });
  const updateRole = trpc.organizations.updateMemberRole.useMutation({ onSuccess: invalidateTeam, onError: error => toast.error(error.message) });
  const cancelInvitation = trpc.organizations.cancelInvitation.useMutation({ onSuccess: invalidateTeam, onError: error => toast.error(error.message) });
  const copyInvite = async () => {
    if (!inviteUrl) return;
    try { await navigator.clipboard.writeText(inviteUrl); toast.success("Tautan undangan disalin."); } catch { toast.error("Salin tautan secara manual dari kolom yang tersedia."); }
  };

  return <section className="mt-8 space-y-6" aria-labelledby="team-settings-title">
    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Kolaborasi</p><h2 id="team-settings-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Ruang kerja dan tim</h2><p className="mt-1 text-sm text-muted-foreground">Kelola siapa yang dapat mengakses data pada organisasi ini.</p></div>{role && <Badge className={`${roleTone[role]} w-fit border px-2.5 py-1 text-xs`}>{roleLabel[role]}</Badge>}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><Building2 className="size-5" /></div><div><h3 className="font-bold">Ruang kerja aktif</h3><p className="mt-0.5 text-sm text-muted-foreground">Data invoice, klien, dan katalog mengikuti ruang kerja yang dipilih.</p></div></div><div className="mt-5 space-y-2"><Label htmlFor="workspace-switch">Pilih ruang kerja</Label><Select value={current.data?.id ? String(current.data.id) : undefined} onValueChange={value => switchWorkspace.mutate({ organizationId: Number(value) })}><SelectTrigger id="workspace-switch" aria-label="Pilih ruang kerja"><SelectValue placeholder="Memuat ruang kerja…" /></SelectTrigger><SelectContent>{workspaces.data?.map(item => item.organization && <SelectItem key={item.organizationId} value={String(item.organizationId)}>{item.organization.name} · {roleLabel[item.role]}</SelectItem>)}</SelectContent></Select></div>{workspaces.data && workspaces.data.length > 1 ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Perpindahan ruang kerja akan memuat ulang data agar tidak ada data lintas organisasi yang tertinggal di layar.</p> : <p className="mt-3 text-xs leading-5 text-muted-foreground">Saat ini akun Anda tergabung pada satu ruang kerja. Undangan yang diterima dapat menambah pilihan di sini.</p>}</CardContent></Card>
      <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><UsersRound className="size-5" /></div><div><h3 className="font-bold">Hak akses</h3><p className="mt-0.5 text-sm text-muted-foreground">Pemilik mengelola semua akses. Admin mengelola data dan undangan. Staf mengelola operasional tanpa mengubah tim.</p></div></div><div className="mt-5 grid gap-2 text-xs sm:grid-cols-3"><div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900"><strong>Pemilik</strong><br />Akses penuh dan role tim.</div><div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-blue-900"><strong>Admin</strong><br />Kelola data dan undangan.</div><div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700"><strong>Staf</strong><br />Kelola invoice dan data operasional.</div></div></CardContent></Card>
    </div>
    <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold">Anggota tim</h3><p className="mt-1 text-sm text-muted-foreground">Setiap anggota hanya dapat melihat data dari ruang kerja yang sedang mereka gunakan.</p></div><Badge variant="outline" className="w-fit">{members.data?.length ?? 0} anggota</Badge></div><div className="mt-5 divide-y rounded-xl border border-slate-200">{members.isLoading ? <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Memuat anggota…</div> : members.data?.map(member => <div key={member.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-primary">{(member.user?.name || member.user?.email || "A").slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{member.user?.name || "Anggota tim"}</p><p className="truncate text-xs text-muted-foreground">{member.user?.email || "Email tidak tersedia"}</p></div>{member.role === "owner" ? <Badge className={`${roleTone.owner} w-fit border`}>Pemilik</Badge> : isOwner ? <Select value={member.role} onValueChange={value => updateRole.mutate({ memberId: member.id, role: value as AssignableRole })}><SelectTrigger className="w-full sm:w-32" aria-label={`Role ${member.user?.name || "anggota"}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staf</SelectItem></SelectContent></Select> : <Badge className={`${roleTone[member.role]} w-fit border`}>{roleLabel[member.role]}</Badge>}</div>)}</div></CardContent></Card>
    {canManageInvites && <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserPlus className="size-5" /></div><div><h3 className="font-bold">Undang anggota</h3><p className="mt-0.5 text-sm text-muted-foreground">Buat tautan aman yang berlaku selama tujuh hari. Bagikan tautan melalui kanal komunikasi bisnis Anda.</p></div></div><form className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_auto]" onSubmit={event => { event.preventDefault(); invite.mutate({ email, role: inviteRole, origin: window.location.origin }); }}><div className="space-y-1.5"><Label htmlFor="invite-email">Email anggota</Label><Input id="invite-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="anggota@bisnis.com" /></div><div className="space-y-1.5"><Label htmlFor="invite-role">Role awal</Label><Select value={inviteRole} onValueChange={value => setInviteRole(value as AssignableRole)}><SelectTrigger id="invite-role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="staff">Staf</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div><Button className="mt-auto gap-2" type="submit" disabled={invite.isPending}>{invite.isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Buat tautan</Button></form>{inviteUrl && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"><p className="text-sm font-semibold text-emerald-950">Tautan undangan siap</p><p className="mt-1 text-xs leading-5 text-emerald-900">Tautan ini hanya ditampilkan setelah dibuat. Salin dan kirim kepada email yang diundang.</p><div className="mt-3 flex gap-2"><Input value={inviteUrl} readOnly aria-label="Tautan undangan" className="bg-white text-xs" /><Button type="button" variant="outline" size="icon" onClick={copyInvite} aria-label="Salin tautan undangan"><Copy className="size-4" /></Button></div></div>}<div className="mt-6"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-slate-500" /><h4 className="text-sm font-semibold">Undangan tertunda</h4></div>{invitations.data?.length ? <div className="mt-3 divide-y rounded-xl border border-slate-200">{invitations.data.map(item => <div key={item.id} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.email}</p><p className="text-xs text-muted-foreground">{roleLabel[item.role]} · berlaku hingga {new Date(item.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p></div><Button type="button" variant="ghost" size="sm" className="w-fit text-destructive hover:text-destructive" onClick={() => cancelInvitation.mutate({ id: item.id })} disabled={cancelInvitation.isPending}>Batalkan</Button></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Belum ada undangan aktif.</p>}</div></CardContent></Card>}
  </section>;
}
