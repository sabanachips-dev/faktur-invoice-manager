import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDate, formatMoney } from "@/lib/format";
import { exportInvoicesCsv, exportInvoicesExcel } from "@/lib/invoiceExport";
import type { InvoiceStatus } from "@shared/invoice";
import { Copy, Download, FileText, Plus, Search, Trash2, CheckCircle2, Eye, FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const statusOptions: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "Semua status" }, { value: "draft", label: "Draft" }, { value: "sent", label: "Terkirim" }, { value: "unpaid", label: "Belum dibayar" }, { value: "paid", label: "Lunas" }, { value: "overdue", label: "Jatuh tempo" }, { value: "cancelled", label: "Dibatalkan" },
];

export default function InvoiceList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");
  const [clientId, setClientId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const input = useMemo(() => ({ status: status === "all" ? undefined : status, clientId: clientId === "all" ? undefined : Number(clientId), search: search || undefined, from: from ? new Date(`${from}T00:00:00`) : undefined, to: to ? new Date(`${to}T23:59:59`) : undefined }), [status, clientId, search, from, to]);
  const invoices = trpc.invoices.list.useQuery(input);
  const clients = trpc.clients.list.useQuery({});
  const duplicate = trpc.invoices.duplicate.useMutation({ onSuccess: id => { toast.success("Invoice diduplikasi sebagai draft."); utils.invoices.list.invalidate(); setLocation(`/invoice/${id}`); }, onError: error => toast.error(error.message) });
  const updateStatus = trpc.invoices.updateStatus.useMutation({ onSuccess: () => { toast.success("Status invoice diperbarui."); utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); }, onError: error => toast.error(error.message) });
  const remove = trpc.invoices.remove.useMutation({ onSuccess: () => { toast.success("Invoice dihapus."); utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); }, onError: error => toast.error(error.message) });

  const reportFilename = `laporan-invoice-${new Date().toISOString().slice(0, 10)}`;
  const exportSource = invoices.data || [];
  return <>
    <PageHeader eyebrow="Penagihan" title="Invoice" description="Kelola seluruh tagihan, status pembayaran, dan tautan publik Anda." action={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!exportSource.length} onClick={() => exportInvoicesCsv(exportSource, reportFilename)} className="gap-2"><Download className="size-4" />CSV</Button><Button variant="outline" disabled={!exportSource.length} onClick={() => exportInvoicesExcel(exportSource, reportFilename)} className="gap-2"><FileSpreadsheet className="size-4" />Excel</Button><Button onClick={() => setLocation("/invoice/new")} className="gap-2"><Plus className="size-4" />Buat invoice baru</Button></div>} />
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_200px_160px_160px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nomor invoice atau klien…" className="pl-9" /></div><Select value={status} onValueChange={value => setStatus(value as "all" | InvoiceStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Select value={clientId} onValueChange={setClientId}><SelectTrigger><SelectValue placeholder="Semua klien" /></SelectTrigger><SelectContent><SelectItem value="all">Semua klien</SelectItem>{clients.data?.map(client => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent></Select><Input aria-label="Tanggal mulai" title="Tanggal mulai" type="date" value={from} onChange={event => setFrom(event.target.value)} /><Input aria-label="Tanggal akhir" title="Tanggal akhir" type="date" value={to} onChange={event => setTo(event.target.value)} /></div></section>
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      {invoices.isLoading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> : !invoices.data?.length ? <EmptyInvoiceState onCreate={() => setLocation("/invoice/new")} /> : <div className="overflow-x-auto"><table className="w-full min-w-[910px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[.09em] text-muted-foreground"><tr><th className="px-6 py-4">Nomor</th><th className="px-4 py-4">Klien</th><th className="px-4 py-4">Tanggal</th><th className="px-4 py-4">Jatuh tempo</th><th className="px-4 py-4 text-right">Jumlah</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead><tbody>
        {invoices.data.map(({ invoice, client }) => <tr key={invoice.id} className={`border-t border-slate-100 hover:bg-slate-50/70 ${invoice.status === "overdue" ? "border-l-[3px] border-l-rose-500" : ""}`}><td className="px-6 py-4"><button className="font-semibold text-primary hover:underline" onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}>{invoice.invoiceNumber}</button></td><td className="px-4 py-4 font-medium text-slate-700">{client.name}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.invoiceDate)}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td><td className="px-4 py-4 text-right font-semibold">{formatMoney(invoice.total, invoice.currency)}</td><td className="px-4 py-4"><InvoiceStatusBadge status={invoice.status} /></td><td className="px-6 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Lihat invoice" onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}><Eye className="size-4" /></Button><Button variant="ghost" size="icon" title="Duplikasi invoice" onClick={() => duplicate.mutate({ id: invoice.id })}><Copy className="size-4" /></Button>{invoice.status !== "paid" && <Button variant="ghost" size="icon" title="Tandai lunas" onClick={() => updateStatus.mutate({ id: invoice.id, status: "paid" })}><CheckCircle2 className="size-4 text-emerald-600" /></Button>}<Button variant="ghost" size="icon" title="Hapus invoice" onClick={() => { if (window.confirm(`Hapus ${invoice.invoiceNumber}?`)) remove.mutate({ id: invoice.id }); }}><Trash2 className="size-4 text-rose-600" /></Button></div></td></tr>)}
      </tbody></table></div>}
    </section>
  </>;
}

function EmptyInvoiceState({ onCreate }: { onCreate: () => void }) { return <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-primary"><FileText className="size-6" /></div><h2 className="mt-4 font-bold">Belum ada invoice</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Invoice akan muncul di sini setelah Anda membuatnya. Mulai dengan menagih klien pertama Anda.</p><Button className="mt-5 gap-2" onClick={onCreate}><Plus className="size-4" />Buat invoice pertama</Button></div>; }
