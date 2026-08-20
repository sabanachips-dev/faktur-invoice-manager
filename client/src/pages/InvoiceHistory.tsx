import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { CheckCircle2, Clock3, Copy, FilePlus2, Mail, Pencil, Send, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

const activityPresentation: Record<string, { label: string; icon: typeof Clock3; color: string }> = {
  created: { label: "Invoice dibuat", icon: FilePlus2, color: "bg-blue-50 text-blue-700" },
  updated: { label: "Invoice diperbarui", icon: Pencil, color: "bg-amber-50 text-amber-700" },
  status_changed: { label: "Status diubah", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700" },
  duplicated: { label: "Invoice disalin", icon: Copy, color: "bg-violet-50 text-violet-700" },
  email_sent: { label: "Email dikirim", icon: Send, color: "bg-sky-50 text-sky-700" },
  deleted: { label: "Invoice dihapus", icon: Trash2, color: "bg-rose-50 text-rose-700" },
};

export default function InvoiceHistory() {
  const [, setLocation] = useLocation();
  const invoiceId = Number(new URLSearchParams(window.location.search).get("invoice")) || undefined;
  const history = trpc.invoices.history.useQuery({ id: invoiceId });
  return <><PageHeader eyebrow="Audit invoice" title={invoiceId ? "Riwayat invoice" : "Riwayat aktivitas invoice"} description={invoiceId ? "Telusuri seluruh perubahan untuk invoice ini." : "Lihat pembuatan, perubahan, pengiriman, duplikasi, dan penghapusan invoice terbaru."} action={invoiceId ? <Button variant="outline" onClick={() => setLocation(`/invoice/${invoiceId}/preview`)}>Buka invoice</Button> : undefined} />
    <Card className="border-slate-200/80"><CardContent className="p-0">{history.isLoading ? <div className="p-8 text-center text-sm text-muted-foreground">Memuat riwayat…</div> : !history.data?.length ? <div className="p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Clock3 className="size-6" /></div><h2 className="mt-4 font-bold">Belum ada aktivitas</h2><p className="mt-2 text-sm text-muted-foreground">Aktivitas invoice berikutnya akan tampil di sini.</p></div> : <ol className="divide-y divide-slate-100">{history.data.map(({ activity, invoiceNumber }) => { const presentation = activityPresentation[activity.action] || { label: "Aktivitas invoice", icon: Clock3, color: "bg-slate-100 text-slate-600" }; const Icon = presentation.icon; return <li key={activity.id} className="flex gap-4 p-5 sm:px-6"><div className={`grid size-10 shrink-0 place-items-center rounded-xl ${presentation.color}`}><Icon className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{presentation.label}</p>{invoiceNumber && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-primary">{invoiceNumber}</span>}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{activity.description}</p><p className="mt-2 text-xs font-medium text-slate-500">{formatDate(activity.createdAt)} · {new Date(activity.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p></div></li>; })}</ol>}</CardContent></Card>
  </>;
}
