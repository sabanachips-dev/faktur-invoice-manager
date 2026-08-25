import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import BatchPrintDialog from "@/components/BatchPrintDialog";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDate, formatMoney } from "@/lib/format";
import { exportInvoicesCsv, exportInvoicesExcel } from "@/lib/invoiceExport";
import type { InvoiceStatus } from "@shared/invoice";
import { CheckCircle2, Copy, Download, Eye, FileSpreadsheet, FileText, History, Layers3, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const statusOptions: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Terkirim" },
  { value: "unpaid", label: "Belum dibayar" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Jatuh tempo" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function InvoiceList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");
  const [clientId, setClientId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; invoiceNumber: string } | null>(null);

  const input = useMemo(() => ({
    status: status === "all" ? undefined : status,
    clientId: clientId === "all" ? undefined : Number(clientId),
    search: search || undefined,
    from: from ? new Date(`${from}T00:00:00`) : undefined,
    to: to ? new Date(`${to}T23:59:59`) : undefined,
  }), [status, clientId, search, from, to]);

  const invoices = trpc.invoices.list.useQuery(input);
  const batchInput = useMemo(() => ({ ids: selectedIds.length ? selectedIds : [1] }), [selectedIds]);
  const batch = trpc.invoices.getMany.useQuery(batchInput, { enabled: selectedIds.length > 0 });
  const clients = trpc.clients.list.useQuery({});

  const duplicate = trpc.invoices.duplicate.useMutation({
    onSuccess: (id) => {
      toast.success("Invoice diduplikasi sebagai draft.");
      utils.invoices.list.invalidate();
      setLocation(`/invoice/${id}`);
    },
    onError: (error) => toast.error(error.message),
  });
  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status invoice diperbarui.");
      utils.invoices.list.invalidate();
      utils.dashboard.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.invoices.remove.useMutation({
    onSuccess: ({ deletedId }) => {
      toast.success("Invoice dihapus.");
      setDeleteTarget(null);
      setSelectedIds((current) => current.filter((id) => id !== deletedId));
      utils.invoices.list.invalidate();
      utils.dashboard.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const reportFilename = `laporan-invoice-${new Date().toISOString().slice(0, 10)}`;
  const exportSource = invoices.data || [];
  const exportWithItemDiscount = async (format: "csv" | "excel") => {
    try {
      const ids = exportSource.map((row) => row.invoice.id);
      const details = ids.length ? await utils.invoices.getMany.fetch({ ids }) : [];
      const itemDiscountByInvoice = new Map(details.map((document) => [document.invoice.id, (document.items as Array<typeof document.items[number] & { discount?: number }>).reduce((total, item) => total + Number(item.discount || 0), 0)]));
      const rows = exportSource.map((row) => ({ ...row, itemDiscount: itemDiscountByInvoice.get(row.invoice.id) || 0 }));
      if (format === "csv") exportInvoicesCsv(rows, reportFilename);
      else await exportInvoicesExcel(rows, reportFilename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ekspor invoice tidak dapat dibuat.");
    }
  };

  const visibleIds = invoices.data?.map((row) => row.invoice.id) || [];
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const toggleInvoice = (id: number, checked: boolean) => setSelectedIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id));
  const toggleVisible = (checked: boolean) => setSelectedIds((current) => checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id)));

  return (
    <>
      <PageHeader
        eyebrow="Penagihan"
        title="Invoice"
        description="Kelola seluruh tagihan, status pembayaran, dan tautan publik Anda."
        action={(
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Button onClick={() => setLocation("/invoice/new")} className="order-first col-span-2 h-12 w-full justify-center gap-2 sm:h-10 sm:w-auto">
              <Plus className="size-4" />Buat invoice baru
            </Button>
            <Button variant="outline" disabled={!exportSource.length} onClick={() => { void exportWithItemDiscount("csv"); }} className="h-11 w-full justify-center gap-2 text-sm sm:h-10 sm:w-auto">
              <Download className="size-4" />CSV
            </Button>
            <Button variant="outline" disabled={!exportSource.length} onClick={() => { void exportWithItemDiscount("excel"); }} className="h-11 w-full justify-center gap-2 text-sm sm:h-10 sm:w-auto">
              <FileSpreadsheet className="size-4" />Excel
            </Button>
            <Button variant="outline" onClick={() => setLocation("/invoice/history")} className="h-11 w-full justify-center gap-2 text-sm sm:h-10 sm:w-auto">
              <History className="size-4" />Riwayat
            </Button>
            <Button variant="outline" onClick={() => setLocation("/invoice/import")} className="h-11 w-full justify-center gap-2 text-sm sm:h-10 sm:w-auto">
              <FileSpreadsheet className="size-4" />Import invoice
            </Button>
            <Button variant="outline" onClick={() => setLocation("/invoice/bulk")} className="h-11 w-full justify-center gap-2 text-sm sm:h-10 sm:w-auto">
              <Layers3 className="size-4" />Invoice massal
            </Button>
          </div>
        )}
      />

      <section className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_200px_160px_160px]">
          <div className="relative col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor invoice atau klien…" className="h-11 pl-9 text-base sm:text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "all" | InvoiceStatus)}>
              <SelectTrigger className="h-11 w-full text-base sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Klien</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-11 w-full text-base sm:text-sm"><SelectValue placeholder="Semua klien" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua klien</SelectItem>{clients.data?.map((client) => <SelectItem key={client.id} value={String(client.id)}>{client.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-date-from" className="text-xs font-semibold text-slate-600">Tanggal mulai</Label>
            <Input id="invoice-date-from" aria-label="Tanggal mulai" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-11 w-full text-base sm:text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-date-to" className="text-xs font-semibold text-slate-600">Tanggal akhir</Label>
            <Input id="invoice-date-to" aria-label="Tanggal akhir" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-11 w-full text-base sm:text-sm" />
          </div>
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="mt-4 flex flex-col items-stretch gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700"><span className="font-bold text-primary">{selectedIds.length}</span> invoice dipilih untuk cetak batch.</p>
          <div className="flex flex-wrap gap-2"><BatchPrintDialog documents={batch.data || []} disabled={batch.isLoading || !batch.data?.length} /><Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedIds([])}><X className="size-4" />Batalkan pilihan</Button></div>
        </section>
      )}

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        {invoices.isLoading ? (
          <div className="space-y-3 p-4 sm:p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 sm:h-14" />)}</div>
        ) : !invoices.data?.length ? (
          <EmptyInvoiceState onCreate={() => setLocation("/invoice/new")} />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {invoices.data.map(({ invoice, client }) => (
                <article key={invoice.id} className={`p-4 ${invoice.status === "overdue" ? "border-l-[3px] border-l-rose-500 pl-[13px]" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox aria-label={`Pilih ${invoice.invoiceNumber}`} checked={selectedIds.includes(invoice.id)} onCheckedChange={(checked) => toggleInvoice(invoice.id, Boolean(checked))} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <button className="min-w-0 truncate text-left text-base font-bold text-primary hover:underline" onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}>{invoice.invoiceNumber}</button>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700">{client.name}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-y border-slate-100 py-3">
                    <div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">Tanggal</p><p className="mt-1 text-sm text-slate-700">{formatDate(invoice.invoiceDate)}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">Jatuh tempo</p><p className="mt-1 text-sm text-slate-700">{formatDate(invoice.dueDate)}</p></div>
                    <div className="col-span-2"><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-slate-500">Jumlah tagihan</p><p className="mt-1 text-lg font-bold text-slate-950">{formatMoney(invoice.total, invoice.currency)}</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-full" title="Lihat invoice" aria-label={`Lihat ${invoice.invoiceNumber}`} onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}><Eye className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="h-10 w-full" title="Duplikasi invoice" aria-label={`Duplikasi ${invoice.invoiceNumber}`} onClick={() => duplicate.mutate({ id: invoice.id })}><Copy className="size-4" /></Button>
                    {invoice.status !== "paid" ? <Button variant="outline" size="icon" className="h-10 w-full" title="Tandai lunas" aria-label={`Tandai ${invoice.invoiceNumber} lunas`} onClick={() => updateStatus.mutate({ id: invoice.id, status: "paid" })}><CheckCircle2 className="size-4 text-emerald-600" /></Button> : <div aria-hidden="true" />}
                    <Button variant="outline" size="icon" className="h-10 w-full" title="Hapus invoice" aria-label={`Hapus ${invoice.invoiceNumber}`} onClick={() => setDeleteTarget({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })}><Trash2 className="size-4 text-rose-600" /></Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[.09em] text-muted-foreground"><tr><th className="w-12 px-4 py-4"><Checkbox aria-label="Pilih semua invoice pada halaman" checked={allVisibleSelected} onCheckedChange={(checked) => toggleVisible(Boolean(checked))} /></th><th className="px-4 py-4">Nomor</th><th className="px-4 py-4">Klien</th><th className="px-4 py-4">Tanggal</th><th className="px-4 py-4">Jatuh tempo</th><th className="px-4 py-4 text-right">Jumlah</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
                <tbody>{invoices.data.map(({ invoice, client }) => <tr key={invoice.id} className={`border-t border-slate-100 hover:bg-slate-50/70 ${invoice.status === "overdue" ? "border-l-[3px] border-l-rose-500" : ""}`}><td className="px-4 py-4"><Checkbox aria-label={`Pilih ${invoice.invoiceNumber}`} checked={selectedIds.includes(invoice.id)} onCheckedChange={(checked) => toggleInvoice(invoice.id, Boolean(checked))} /></td><td className="px-4 py-4"><button className="font-semibold text-primary hover:underline" onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}>{invoice.invoiceNumber}</button></td><td className="px-4 py-4 font-medium text-slate-700">{client.name}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.invoiceDate)}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td><td className="px-4 py-4 text-right font-semibold">{formatMoney(invoice.total, invoice.currency)}</td><td className="px-4 py-4"><InvoiceStatusBadge status={invoice.status} /></td><td className="px-6 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Lihat invoice" onClick={() => setLocation(`/invoice/${invoice.id}/preview`)}><Eye className="size-4" /></Button><Button variant="ghost" size="icon" title="Duplikasi invoice" onClick={() => duplicate.mutate({ id: invoice.id })}><Copy className="size-4" /></Button>{invoice.status !== "paid" && <Button variant="ghost" size="icon" title="Tandai lunas" onClick={() => updateStatus.mutate({ id: invoice.id, status: "paid" })}><CheckCircle2 className="size-4 text-emerald-600" /></Button>}<Button variant="ghost" size="icon" title="Hapus invoice" onClick={() => setDeleteTarget({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })}><Trash2 className="size-4 text-rose-600" /></Button></div></td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus invoice?</AlertDialogTitle><AlertDialogDescription>Invoice {deleteTarget?.invoiceNumber} beserta itemnya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" disabled={remove.isPending} onClick={(event) => { event.preventDefault(); if (deleteTarget) remove.mutate({ id: deleteTarget.id }); }}>{remove.isPending ? "Menghapus…" : "Hapus invoice"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyInvoiceState({ onCreate }: { onCreate: () => void }) {
  return <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-primary"><FileText className="size-6" /></div><h2 className="mt-4 font-bold">Belum ada invoice</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Invoice akan muncul di sini setelah Anda membuatnya. Mulai dengan menagih klien pertama Anda.</p><Button className="mt-5 gap-2" onClick={onCreate}><Plus className="size-4" />Buat invoice pertama</Button></div>;
}
