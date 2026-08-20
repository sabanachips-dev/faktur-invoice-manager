import PageHeader from "@/components/PageHeader";
import WorkflowStepper from "@/components/WorkflowStepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readInvoiceImportSheet, downloadInvoiceImportTemplate, describeImportedInvoice, type InvoiceSheetRow } from "@/lib/invoiceSheetImport";
import { trpc } from "@/lib/trpc";
import { formatDate, formatMoney } from "@/lib/format";
import { calculateInvoiceAmounts } from "@shared/invoice";
import { parseInvoiceImportRows, type ImportInvoicePreview } from "@shared/invoiceImport";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ImportInvoices() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<InvoiceSheetRow[]>([]);
  const [preview, setPreview] = useState<ImportInvoicePreview | null>(null);
  const [fileName, setFileName] = useState("");
  const workflowStep = !rows.length ? 1 : preview?.errors.length ? 2 : 3;
  const importMutation = trpc.invoices.importFromSheet.useMutation({
    onSuccess: result => { toast.success(`${result.createdCount} invoice draft berhasil diimpor.`); utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); setLocation("/invoice"); },
    onError: error => toast.error(error.message),
  });

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const data = await readInvoiceImportSheet(file);
      const parsed = parseInvoiceImportRows(data);
      setRows(data); setPreview(parsed); setFileName(file.name);
      if (parsed.errors.length) toast.error(`${parsed.errors.length} kesalahan ditemukan. Perbaiki sheet lalu unggah kembali.`);
      else toast.success(`${parsed.invoices.length} invoice siap diimpor.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "File tidak dapat dibaca."); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  };
  const confirmImport = () => { if (!preview?.invoices.length || preview.errors.length) return; importMutation.mutate({ rows }); };

  return <>
    <PageHeader eyebrow="Import spreadsheet" title="Import invoice massal" description="Buat banyak invoice lengkap dari Excel atau CSV. Satu Import_ID dapat memiliki beberapa baris item." />
    <WorkflowStepper className="mb-6" currentStep={workflowStep} steps={[{ label: "Unggah file", description: "Pilih Excel atau CSV" }, { label: "Periksa data", description: "Tinjau error dan pratinjau" }, { label: "Buat invoice", description: "Konfirmasi invoice draft" }]} />
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-primary"><FileSpreadsheet className="size-5" /></div><div><h2 className="font-bold">1. Gunakan template invoice lengkap</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Kolom template mencakup Import_ID, nama toko/klien, kontak, alamat, tanggal, item, Qty, harga, diskon, pajak, mata uang, serta catatan. Baris dengan Import_ID yang sama digabung menjadi satu invoice.</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button type="button" variant="outline" className="gap-2" onClick={() => void downloadInvoiceImportTemplate()}><Download className="size-4" />Unduh template Excel</Button><Button type="button" className="gap-2" onClick={() => fileInput.current?.click()}><Upload className="size-4" />Pilih file</Button><Input ref={fileInput} className="sr-only" aria-label="Unggah file impor invoice" type="file" accept=".xlsx,.xls,.csv" onChange={event => void handleFile(event.target.files?.[0])} /></div>{fileName && <p className="mt-3 text-xs font-medium text-slate-600">File terpilih: {fileName}</p>}</CardContent></Card>
        {preview?.errors.length ? <Alert variant="destructive"><AlertCircle className="size-4" /><AlertTitle>Sheet belum dapat diimpor</AlertTitle><AlertDescription><ul className="mt-2 list-disc space-y-1 pl-4">{preview.errors.slice(0, 12).map(error => <li key={error}>{error}</li>)}</ul>{preview.errors.length > 12 && <p className="mt-2">Dan {preview.errors.length - 12} kesalahan lainnya.</p>}</AlertDescription></Alert> : null}
        {preview?.invoices.length ? <Card className="border-slate-200/80"><CardContent className="p-0"><div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="font-bold">2. Pratinjau invoice yang akan dibuat</h2><p className="mt-1 text-sm text-muted-foreground">{preview.invoices.length} invoice draft akan dibuat. Nomor invoice dibuat otomatis.</p></div><div className="divide-y divide-slate-100">{preview.invoices.map(invoice => { const amounts = calculateInvoiceAmounts(invoice.items, invoice.discountValue, invoice.taxRate, invoice.discountType); return <div key={invoice.importId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-semibold text-slate-900">{invoice.importId} · {invoice.storeNumber}</p><p className="mt-1 text-sm text-muted-foreground">{describeImportedInvoice(invoice)} · Tanggal {formatDate(invoice.invoiceDate)} · Jatuh tempo {formatDate(invoice.dueDate)}</p><p className="mt-1 text-xs text-slate-500">{invoice.clientName}{invoice.shippingAddress ? ` · Kirim: ${invoice.shippingAddress}` : ""}</p></div><p className="shrink-0 font-bold text-primary">{formatMoney(amounts.total, invoice.currency)}</p></div>; })}</div></CardContent></Card> : null}
      </div>
      <Card className="h-fit border-slate-200/80 xl:sticky xl:top-6"><CardContent className="p-5"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-5" /></div><h2 className="mt-4 font-bold">Siap membuat invoice</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Tinjau data terlebih dahulu. Invoice yang berhasil dibuat berstatus Draft dan dapat diedit satu per satu setelah impor.</p><div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Baris sheet</span><strong>{rows.length}</strong></div><div className="mt-2 flex justify-between"><span className="text-muted-foreground">Invoice valid</span><strong>{preview?.invoices.length || 0}</strong></div></div><Button className="mt-5 w-full" disabled={!preview?.invoices.length || Boolean(preview.errors.length) || importMutation.isPending} onClick={confirmImport}>{importMutation.isPending ? "Membuat invoice…" : `Buat ${preview?.invoices.length || 0} invoice`}</Button></CardContent></Card>
    </div>
  </>;
}
