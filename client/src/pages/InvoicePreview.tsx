import BatchPrintDialog from "@/components/BatchPrintDialog";
import InvoiceDocument, { type InvoiceDocumentData } from "@/components/InvoiceDocument";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import PortableInvoiceDocument from "@/components/PortableInvoiceDocument";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import { printInvoice } from "@/lib/printInvoice";
import { trpc } from "@/lib/trpc";
import { FULFILLMENT_STATUSES, labelFulfillmentStatus, type FulfillmentStatus } from "@shared/invoice";
import { Copy, Download, History, Mail, Pencil, Printer, ReceiptText, Search, Share2, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function InvoicePreview() {
  const [, params] = useRoute("/invoice/:id/preview");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const invoice = trpc.invoices.get.useQuery({ id });
  const documentRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>("pending_payment");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const utils = trpc.useUtils();
  const sendEmail = trpc.invoices.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Invoice berhasil dikirim melalui email.");
      utils.invoices.get.invalidate({ id });
      utils.invoices.list.invalidate();
      utils.dashboard.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const duplicate = trpc.invoices.duplicate.useMutation({
    onSuccess: (newId) => {
      utils.invoices.list.invalidate();
      toast.success("Invoice disalin sebagai draft dan siap diedit.");
      setLocation(`/invoice/${newId}`);
    },
    onError: (error) => toast.error(error.message),
  });
  type FulfillmentMutation = { isPending: boolean; mutate: (input: { id: number; fulfillmentStatus: FulfillmentStatus; courierName: string | null; trackingNumber: string | null }, options: { onSuccess: () => void; onError: (error: { message: string }) => void }) => void };
  const updateFulfillment = (trpc.invoices as unknown as { updateFulfillment: { useMutation: () => FulfillmentMutation } }).updateFulfillment.useMutation();

  useEffect(() => {
    const current = invoice.data as InvoiceDocumentData | undefined;
    if (!current) return;
    setFulfillmentStatus(current.invoice.fulfillmentStatus || "pending_payment");
    setCourierName(current.invoice.courierName || "");
    setTrackingNumber(current.invoice.trackingNumber || "");
  }, [invoice.data]);

  if (invoice.isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Memuat preview invoice…</div>;
  if (!invoice.data) return <div className="py-16 text-center text-sm text-muted-foreground">Invoice tidak ditemukan.</div>;

  const data = invoice.data as InvoiceDocumentData;
  const publicLink = `${window.location.origin}/p/${data.invoice.publicId}`;
  const requiresTracking = fulfillmentStatus === "shipped" || fulfillmentStatus === "completed";
  const saveFulfillment = () => updateFulfillment.mutate({ id, fulfillmentStatus, courierName: courierName || null, trackingNumber: trackingNumber || null }, {
    onSuccess: () => {
      toast.success("Status pesanan diperbarui.");
      utils.invoices.get.invalidate({ id });
      utils.invoices.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const printQuickly = () => {
    if (printInvoice("a4")) toast.success("Dialog cetak A4 dibuka. Pilih printer atau Simpan sebagai PDF.");
    else toast.error("Dokumen invoice belum siap dicetak. Silakan coba lagi.");
  };
  const printPortable = () => {
    if (printInvoice("receipt80", "invoice-portable")) toast.success("Template portable 80 mm dibuka. Pilih printer thermal atau portable.");
    else toast.error("Template portable belum siap. Silakan coba lagi.");
  };

  return (
    <div className="pb-10">
      <div className="no-print mx-auto mb-6 flex max-w-[820px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="text-xl font-bold tracking-tight">Preview invoice</h1><InvoiceStatusBadge status={data.invoice.status} /></div><p className="mt-1 text-sm text-muted-foreground">{data.invoice.invoiceNumber}</p></div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button className="order-first col-span-2 h-12 w-full justify-center gap-2 sm:h-9 sm:w-auto" onClick={printQuickly}><Printer className="size-4" />Cetak cepat</Button>
          <Button variant="outline" size="sm" className="order-2 col-span-2 h-11 w-full justify-center gap-2 sm:h-9 sm:w-auto" onClick={printPortable}><ReceiptText className="size-4" />Template portable 80 mm</Button>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" onClick={() => setLocation(`/invoice/${id}`)}><Pencil className="size-4" />Edit</Button>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" disabled={duplicate.isPending} onClick={() => duplicate.mutate({ id })}><Copy className="size-4" />{duplicate.isPending ? "Menyalin…" : "Copy & edit"}</Button>
          <div className="sm:contents"><BatchPrintDialog documents={[data]} /></div>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success("Tautan publik disalin."); }}><Share2 className="size-4" />Bagikan link</Button>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" disabled={sendEmail.isPending || !data.client.email} title={!data.client.email ? "Tambahkan email klien terlebih dahulu" : undefined} onClick={() => sendEmail.mutate({ id, origin: window.location.origin })}><Mail className="size-4" />{sendEmail.isPending ? "Mengirim…" : "Kirim email"}</Button>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" onClick={() => setLocation(`/invoice/history?invoice=${id}`)}><History className="size-4" />Riwayat</Button>
          <Button variant="outline" size="sm" className="h-10 w-full justify-center gap-2 sm:h-9 sm:w-auto" disabled={downloading} onClick={async () => { if (!documentRef.current) return; setDownloading(true); try { await downloadInvoicePdf(documentRef.current, data.invoice.invoiceNumber); toast.success("PDF invoice diunduh."); } catch { toast.error("PDF belum dapat dibuat. Silakan coba lagi."); } finally { setDownloading(false); } }}><Download className="size-4" />{downloading ? "Membuat PDF…" : "Download PDF"}</Button>
        </div>
      </div>

      <Card className="no-print mx-auto mb-6 max-w-[820px] border-blue-100"><CardContent className="p-4 sm:p-5"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><Truck className="size-5" /></div><div className="min-w-0 flex-1"><h2 className="font-bold">Status pesanan & pengiriman</h2><p className="mt-1 text-sm text-muted-foreground">Status pembayaran tetap terpisah. Masukkan kurir dan resi ketika pesanan dikirim.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="space-y-1.5"><Label>Status pesanan</Label><Select value={fulfillmentStatus} onValueChange={(value) => setFulfillmentStatus(value as FulfillmentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FULFILLMENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{labelFulfillmentStatus(status)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>Kurir</Label><Input value={courierName} onChange={(event) => setCourierName(event.target.value)} placeholder="Contoh: JNE" /></div><div className="space-y-1.5"><Label>Nomor resi</Label><Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Contoh: JNE123456789" /></div></div>{requiresTracking && <p className="mt-3 text-xs font-medium text-amber-700">Kurir dan nomor resi wajib diisi untuk status Dikirim atau Selesai.</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={updateFulfillment.isPending || (requiresTracking && (!courierName || !trackingNumber))} onClick={saveFulfillment}>{updateFulfillment.isPending ? "Menyimpan…" : "Simpan status pesanan"}</Button><Button size="sm" variant="outline" className="gap-2" onClick={() => setLocation(`/shipping?invoice=${id}`)}><Search className="size-4" />Cek resi</Button></div></div></div></CardContent></Card>
      <div ref={documentRef}><InvoiceDocument data={data} /></div>
      <div className="hidden" aria-hidden="true"><PortableInvoiceDocument data={data} /></div>
    </div>
  );
}
