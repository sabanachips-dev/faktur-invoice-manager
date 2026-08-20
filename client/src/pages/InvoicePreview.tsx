import InvoiceDocument, { type InvoiceDocumentData } from "@/components/InvoiceDocument";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import { trpc } from "@/lib/trpc";
import { Download, Mail, Pencil, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function InvoicePreview() {
  const [, params] = useRoute("/invoice/:id/preview"); const id = Number(params?.id);
  const [, setLocation] = useLocation(); const invoice = trpc.invoices.get.useQuery({ id });
  const documentRef = useRef<HTMLDivElement>(null); const [downloading, setDownloading] = useState(false);
  const utils = trpc.useUtils();
  const sendEmail = trpc.invoices.sendEmail.useMutation({ onSuccess: () => { toast.success("Invoice berhasil dikirim melalui email."); utils.invoices.get.invalidate({ id }); utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); }, onError: error => toast.error(error.message) });
  if (invoice.isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Memuat preview invoice…</div>;
  if (!invoice.data) return <div className="py-16 text-center text-sm text-muted-foreground">Invoice tidak ditemukan.</div>;
  const data = invoice.data as InvoiceDocumentData;
  const publicLink = `${window.location.origin}/p/${data.invoice.publicId}`;
  return <div className="pb-10"><div className="no-print mx-auto mb-6 flex max-w-[820px] flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><h1 className="text-xl font-bold tracking-tight">Preview invoice</h1><InvoiceStatusBadge status={data.invoice.status} /></div><p className="mt-1 text-sm text-muted-foreground">{data.invoice.invoiceNumber}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation(`/invoice/${id}`)}><Pencil className="size-4" />Edit</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success("Tautan publik disalin."); }}><Share2 className="size-4" />Bagikan link</Button><Button variant="outline" size="sm" className="gap-2" disabled={sendEmail.isPending || !data.client.email} title={!data.client.email ? "Tambahkan email klien terlebih dahulu" : undefined} onClick={() => sendEmail.mutate({ id, origin: window.location.origin })}><Mail className="size-4" />{sendEmail.isPending ? "Mengirim…" : "Kirim email"}</Button><Button size="sm" className="gap-2" disabled={downloading} onClick={async () => { if (!documentRef.current) return; setDownloading(true); try { await downloadInvoicePdf(documentRef.current, data.invoice.invoiceNumber); toast.success("PDF invoice diunduh."); } catch { toast.error("PDF belum dapat dibuat. Silakan coba lagi."); } finally { setDownloading(false); } }}><Download className="size-4" />{downloading ? "Membuat PDF…" : "Download PDF"}</Button></div></div><div ref={documentRef}><InvoiceDocument data={data} /></div></div>;
}
