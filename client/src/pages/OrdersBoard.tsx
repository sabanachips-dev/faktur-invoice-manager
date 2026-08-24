import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { FULFILLMENT_STATUSES, labelFulfillmentStatus, type FulfillmentStatus } from "@shared/invoice";
import { ArrowUpRight, GripVertical, PackageOpen, Plus, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type BoardInvoice = { id: number; invoiceNumber: string; invoiceDate: Date | string; dueDate: Date | string; total: number; currency: string; isBatchSummary: boolean; fulfillmentStatus?: FulfillmentStatus; courierName?: string | null; trackingNumber?: string | null; shippingAddress?: string | null };
type BoardRow = { invoice: BoardInvoice; client: { name: string } };
type FulfillmentMutation = { isPending: boolean; mutate: (input: { id: number; fulfillmentStatus: FulfillmentStatus; courierName: string | null; trackingNumber: string | null }, options: { onSuccess: () => void; onError: (error: { message: string }) => void }) => void };

const columnStyle: Record<FulfillmentStatus, { tint: string; dot: string }> = {
  pending_payment: { tint: "border-amber-200 bg-amber-50/70", dot: "bg-amber-500" },
  paid: { tint: "border-sky-200 bg-sky-50/70", dot: "bg-sky-500" },
  processing: { tint: "border-violet-200 bg-violet-50/70", dot: "bg-violet-500" },
  shipped: { tint: "border-indigo-200 bg-indigo-50/70", dot: "bg-indigo-500" },
  completed: { tint: "border-emerald-200 bg-emerald-50/70", dot: "bg-emerald-500" },
  cancelled: { tint: "border-rose-200 bg-rose-50/70", dot: "bg-rose-500" },
};

export default function OrdersBoard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const invoices = trpc.invoices.list.useQuery({});
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const updateFulfillment = (trpc.invoices as unknown as { updateFulfillment: { useMutation: () => FulfillmentMutation } }).updateFulfillment.useMutation();
  const rows = ((invoices.data || []) as unknown as BoardRow[]).filter(row => !row.invoice.isBatchSummary);
  const updateStage = (row: BoardRow, nextStatus: FulfillmentStatus) => {
    const currentStatus = row.invoice.fulfillmentStatus || "pending_payment";
    if (currentStatus === nextStatus) return;
    const needsTracking = nextStatus === "shipped" || nextStatus === "completed";
    if (needsTracking && (!row.invoice.courierName || !row.invoice.trackingNumber)) {
      toast.message("Isi kurir dan nomor resi sebelum mengirim pesanan.");
      setLocation(`/invoice/${row.invoice.id}/preview`);
      return;
    }
    updateFulfillment.mutate({ id: row.invoice.id, fulfillmentStatus: nextStatus, courierName: row.invoice.courierName || null, trackingNumber: row.invoice.trackingNumber || null }, { onSuccess: () => { toast.success(`Pesanan dipindahkan ke ${labelFulfillmentStatus(nextStatus)}.`); utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); }, onError: error => toast.error(error.message) });
  };

  return <>
    <PageHeader eyebrow="Operasional pengiriman" title="Kanban Pesanan" description="Pindahkan pesanan antar tahap. Untuk Dikirim atau Selesai, resi wajib diisi lebih dahulu pada preview invoice." action={<Button className="gap-2" onClick={() => setLocation("/invoice/new")}><Plus className="size-4" />Buat invoice</Button>} />
    {invoices.isLoading ? <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72" />)}</div> : <><div className="overflow-x-auto pb-4"><div className="grid min-w-[1720px] grid-cols-6 gap-4">{FULFILLMENT_STATUSES.map(status => {
      const style = columnStyle[status];
      const columnRows = rows.filter(row => (row.invoice.fulfillmentStatus || "pending_payment") === status);
      return <section key={status} className={`rounded-2xl border ${style.tint}`} onDragOver={event => event.preventDefault()} onDrop={() => { const row = rows.find(candidate => candidate.invoice.id === draggingId); if (row) updateStage(row, status); setDraggingId(null); }}><div className="flex items-center justify-between px-4 py-4"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${style.dot}`} /><h2 className="text-sm font-bold text-slate-800">{labelFulfillmentStatus(status)}</h2></div><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-slate-600">{columnRows.length}</span></div><div className="min-h-[490px] space-y-3 px-3 pb-3">{columnRows.map(row => <article key={row.invoice.id} draggable onDragStart={() => setDraggingId(row.invoice.id)} className="cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"><div className="flex items-start justify-between gap-2"><button className="text-left text-sm font-bold text-primary hover:underline" onClick={() => setLocation(`/invoice/${row.invoice.id}/preview`)}>{row.invoice.invoiceNumber}</button><GripVertical className="size-4 shrink-0 text-slate-300" /></div><p className="mt-1 truncate text-sm font-medium text-slate-700">{row.client.name}</p><p className="mt-3 text-lg font-bold tracking-tight text-slate-900">{formatMoney(row.invoice.total, row.invoice.currency)}</p><div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500"><p>Jatuh tempo {formatDate(row.invoice.dueDate)}</p>{row.invoice.shippingAddress && <p className="mt-1 line-clamp-2">Kirim: {row.invoice.shippingAddress}</p>}{row.invoice.courierName && row.invoice.trackingNumber && <p className="mt-2 flex items-center gap-1 font-medium text-indigo-700"><Truck className="size-3.5" />{row.invoice.courierName} · {row.invoice.trackingNumber}</p>}</div><div className="mt-4"><Select value={status} onValueChange={value => updateStage(row, value as FulfillmentStatus)} disabled={updateFulfillment.isPending}><SelectTrigger className="h-9 bg-slate-50 text-xs"><SelectValue /></SelectTrigger><SelectContent>{FULFILLMENT_STATUSES.map(option => <SelectItem key={option} value={option}>{labelFulfillmentStatus(option)}</SelectItem>)}</SelectContent></Select></div></article>)}{columnRows.length === 0 && <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 text-center"><div><PackageOpen className="mx-auto size-5 text-slate-300" /><p className="mt-2 text-xs leading-5 text-slate-500">Tidak ada pesanan pada tahap ini.</p></div></div>}</div></section>;
    })}</div></div>
    <Card className="mt-2 border-slate-200/80"><CardContent className="flex flex-col gap-3 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p>Tarik kartu ke kolom lain atau gunakan pilihan tahap pada kartu. Kartu tanpa resi akan diarahkan ke preview saat dipindahkan ke status pengiriman.</p><Button size="sm" variant="ghost" className="shrink-0 gap-1 text-primary hover:bg-blue-50" onClick={() => setLocation("/invoice")}><ArrowUpRight className="size-4" />Daftar invoice</Button></CardContent></Card>
    </>}
  </>;
}
