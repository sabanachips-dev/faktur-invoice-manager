import InvoiceDocument, { type InvoiceDocumentData } from "@/components/InvoiceDocument";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { printInvoiceBatch, type BatchPrintLayout, type PrintPaperSize } from "@/lib/printInvoice";
import { getInvoiceCopyLabel } from "@shared/print";
import { groupBatchPrintPages } from "@shared/batchPrintLayout";
import { Copy, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const paperOptions: { value: PrintPaperSize; label: string }[] = [
  { value: "a4", label: "A4" }, { value: "letter", label: "Letter" }, { value: "a5", label: "A5" }, { value: "receipt80", label: "Struk 80 mm" },
];

export default function BatchPrintDialog({ documents, disabled = false }: { documents: InvoiceDocumentData[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [paper, setPaper] = useState<PrintPaperSize>("a4");
  const [layout, setLayout] = useState<BatchPrintLayout>("one");
  const [copies, setCopies] = useState("1");
  const copyCount = Math.min(99, Math.max(1, Math.round(Number(copies) || 1)));
  const printDocuments = useMemo(() => documents.flatMap(data => Array.from({ length: copyCount }, (_, index) => ({ data, copyLabel: getInvoiceCopyLabel(index) }))), [documents, copyCount]);
  const isTwoUpAvailable = paper === "a4";
  const activeLayout = isTwoUpAvailable ? layout : "one";
  const printPages = useMemo(() => groupBatchPrintPages(printDocuments, activeLayout), [printDocuments, activeLayout]);
  const compactPageCount = printPages.filter(page => page.mode === "compact").length;
  const batchPrintMarkup = <div id="invoice-batch-print" className={`layout-${activeLayout} hidden`} aria-hidden="true">{printPages.map((page, pageIndex) => <section key={`batch-page-${pageIndex}`} className={`batch-page batch-page-${page.mode}`}>{page.documents.map(({ data, copyLabel }, index) => <div key={`${data.invoice.id}-${copyLabel}-${pageIndex}-${index}`} className="batch-document"><InvoiceDocument data={data} copyLabel={copyLabel} compact={page.mode === "compact"} documentId={`batch-invoice-${data.invoice.id}-${pageIndex}-${index}`} /></div>)}</section>)}</div>;
  return <><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="gap-2" disabled={disabled || !documents.length}><Printer className="size-4" />Cetak batch</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Cetak invoice terpilih</DialogTitle><DialogDescription>Setiap invoice memuat tanggal invoice serta label Faktur Asli atau salinan untuk kebutuhan cetak manual.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-sm font-medium">Ukuran kertas</label><Select value={paper} onValueChange={value => setPaper(value as PrintPaperSize)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paperOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="copy-count">Jumlah salinan</label><Input id="copy-count" type="number" min="1" max="99" value={copies} onChange={event => setCopies(event.target.value)} /><p className="text-xs text-muted-foreground">Maksimum 99 salinan per pekerjaan cetak.</p></div></div><div className="space-y-1.5"><label className="text-sm font-medium">Tata letak</label><Select value={activeLayout} onValueChange={value => setLayout(value as BatchPrintLayout)} disabled={!isTwoUpAvailable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one">Satu invoice per lembar</SelectItem><SelectItem value="two">Dua invoice ringkas per halaman A4</SelectItem></SelectContent></Select>{activeLayout === "two" && <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs text-blue-900"><div className="rounded border border-blue-200 bg-white p-2">Invoice 1<br /><span className="text-[10px] text-blue-600">Dokumen ringkas dengan ukuran native</span></div><div className="rounded border border-blue-200 bg-white p-2">Invoice 2<br /><span className="text-[10px] text-blue-600">Dua dokumen tersusun dalam satu A4</span></div></div>}{!isTwoUpAvailable && <p className="text-xs text-muted-foreground">Layout dua invoice tersedia khusus untuk A4 potret agar ukuran dan margin tetap konsisten.</p>}</div><div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">Ringkasan cetak:</strong> {documents.length} invoice × {copyCount} salinan = {printDocuments.length} dokumen pada {printPages.length} halaman. Salinan pertama berlabel <em>Faktur Asli</em>; berikutnya <em>Copy 1</em>, <em>Copy 2</em>, dan seterusnya.{activeLayout === "two" && <span> {compactPageCount ? `${compactPageCount} halaman memakai dua invoice ringkas native pada A4.` : "Invoice dengan lebih dari 3 item tetap dicetak satu per halaman agar tidak terpotong."}</span>}</div></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button className="gap-2" onClick={() => { printInvoiceBatch(paper, activeLayout); setOpen(false); }}><Printer className="size-4" />Cetak sekarang</Button></div></DialogContent></Dialog>{createPortal(batchPrintMarkup, document.body)}</>;
}
