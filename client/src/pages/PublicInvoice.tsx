import InvoiceDocument, { type InvoiceDocumentData } from "@/components/InvoiceDocument";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import PrintInvoiceDialog from "@/components/PrintInvoiceDialog";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/lib/downloadInvoicePdf";
import { trpc } from "@/lib/trpc";
import { Download, FileQuestion } from "lucide-react";
import { useRef, useState } from "react";
import { useRoute } from "wouter";

export default function PublicInvoice() {
  const [, params] = useRoute("/p/:publicId"); const publicId = params?.publicId || "";
  const invoice = trpc.publicInvoice.get.useQuery({ publicId });
  const documentRef = useRef<HTMLDivElement>(null); const [downloading, setDownloading] = useState(false);
  if (invoice.isLoading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-muted-foreground">Memuat invoice…</main>;
  if (!invoice.data) return <main className="grid min-h-screen place-items-center bg-slate-50 px-5"><div className="max-w-sm text-center"><FileQuestion className="mx-auto size-10 text-slate-300" /><h1 className="mt-4 text-xl font-bold">Invoice tidak ditemukan</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Tautan yang Anda buka tidak tersedia atau sudah tidak dapat diakses.</p></div></main>;
  const data = invoice.data as InvoiceDocumentData;
  return <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-6 sm:py-8"><div className="no-print mx-auto mb-5 flex max-w-[820px] items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white text-sm font-bold shadow-sm" style={{ color: data.business.accentColor }}>{data.business.logoUrl ? <img src={data.business.logoUrl} alt="Logo bisnis" className="size-full object-cover" /> : data.business.businessName.slice(0, 1)}</div><span className="text-sm font-semibold text-slate-700">Invoice dari {data.business.businessName}</span></div><div className="flex gap-2"><PrintInvoiceDialog compact /><Button size="sm" className="gap-2" disabled={downloading} onClick={async () => { if (!documentRef.current) return; setDownloading(true); try { await downloadInvoicePdf(documentRef.current, data.invoice.invoiceNumber); } finally { setDownloading(false); } }}><Download className="size-4" />{downloading ? "Membuat PDF…" : "Download PDF"}</Button></div></div><div className="no-print mx-auto mb-4 flex max-w-[820px] justify-end"><InvoiceStatusBadge status={data.invoice.status} /></div><div ref={documentRef}><InvoiceDocument data={data} publicView /></div><p className="no-print mx-auto mt-5 max-w-[820px] text-center text-xs text-muted-foreground">Dibuat dengan Faktur</p></main>;
}
