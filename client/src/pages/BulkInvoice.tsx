import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import WorkflowStepper from "@/components/WorkflowStepper";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { downloadStoreImportTemplate, importStoresFromSpreadsheet } from "@/lib/bulkInvoiceImport";
import { toDateInput } from "@/lib/format";
import { Building2, Download, Layers3, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function parseStoreNumbers(value: string) {
  return value.split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
}

export default function BulkInvoice() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const invoices = trpc.invoices.list.useQuery({});
  const [sourceInvoiceId, setSourceInvoiceId] = useState("");
  const [storeNumbersText, setStoreNumbersText] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(toDateInput(new Date()));
  const [dueDate, setDueDate] = useState(toDateInput(new Date(Date.now() + 14 * 86400000)));
  const fileInput = useRef<HTMLInputElement>(null);
  const storeNumbers = useMemo(() => parseStoreNumbers(storeNumbersText), [storeNumbersText]);
  const source = invoices.data?.find(row => row.invoice.id === Number(sourceInvoiceId));
  const workflowStep = !sourceInvoiceId ? 1 : !storeNumbers.length || !shippingAddress.trim() ? 2 : 3;
  const create = trpc.invoices.bulkCreate.useMutation({
    onSuccess: result => {
      utils.invoices.list.invalidate();
      utils.dashboard.get.invalidate();
      toast.success(`${result.storeInvoiceIds.length} invoice toko dan 1 invoice rekap berhasil dibuat.`);
      setLocation("/invoice");
    },
    onError: error => toast.error(error.message),
  });
  const submit = () => {
    if (!sourceInvoiceId) return toast.error("Pilih invoice sumber terlebih dahulu.");
    if (!shippingAddress.trim()) return toast.error("Alamat gudang/pengiriman wajib diisi.");
    if (!storeNumbers.length) return toast.error("Masukkan minimal satu nomor toko.");
    if (new Set(storeNumbers).size !== storeNumbers.length) return toast.error("Nomor toko tidak boleh duplikat.");
    create.mutate({ sourceInvoiceId: Number(sourceInvoiceId), storeNumbers, shippingAddress: shippingAddress.trim(), invoiceDate: new Date(`${invoiceDate}T12:00:00`), dueDate: new Date(`${dueDate}T12:00:00`) });
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const imported = await importStoresFromSpreadsheet(file);
      setStoreNumbersText(imported.storeNumbers.join("\n"));
      if (imported.shippingAddress) setShippingAddress(imported.shippingAddress);
      if (imported.warning) toast.warning(imported.warning); else toast.success(`${imported.storeNumbers.length} nomor toko berhasil diimpor.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File tidak dapat diimpor.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  return <><PageHeader eyebrow="Penagihan massal" title="Buat invoice untuk banyak toko" description="Pilih satu invoice sebagai template; item, kuantitas, harga, pajak, dan diskon akan disalin ke setiap toko." /><WorkflowStepper className="mb-6" currentStep={workflowStep} steps={[{ label: "Pilih invoice", description: "Tentukan invoice sumber" }, { label: "Toko & pengiriman", description: "Isi toko dan alamat gudang" }, { label: "Buat rekap", description: "Buat semua invoice dan rekap" }]} />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-6"><Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-primary"><Layers3 className="size-5" /></div><div><h2 className="font-bold">Invoice sumber</h2><p className="mt-1 text-sm text-muted-foreground">Data item, kuantitas, diskon, dan pajak disalin dari invoice ini.</p></div></div><Select value={sourceInvoiceId} onValueChange={setSourceInvoiceId}><SelectTrigger className="h-11"><SelectValue placeholder="Pilih invoice yang akan disalin" /></SelectTrigger><SelectContent>{invoices.data?.map(({ invoice, client }) => <SelectItem key={invoice.id} value={String(invoice.id)}>{invoice.invoiceNumber} — {client.name}</SelectItem>)}</SelectContent></Select>{source && <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm"><div className="flex items-center justify-between"><span className="font-semibold text-slate-800">{source.invoice.invoiceNumber}</span><span className="text-muted-foreground">{source.client.name}</span></div><p className="mt-2 text-muted-foreground">{source.invoice.discountType === "percentage" ? `Diskon ${source.invoice.discountValue}%` : "Diskon nominal"} · {source.invoice.taxRate}% pajak · Item akan sama untuk semua toko.</p></div>}</CardContent></Card>
      <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex gap-3"><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Building2 className="size-5" /></div><div><h2 className="font-bold">Toko & pengiriman bersama</h2><p className="mt-1 text-sm text-muted-foreground">Satu nomor toko per baris atau pisahkan dengan koma. Cocok untuk 16 toko ke satu gudang.</p></div></div><div className="mb-4 flex flex-wrap gap-2"><input ref={fileInput} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={event => { void importFile(event.target.files?.[0]); }} /><Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInput.current?.click()}><Upload className="size-4" />Impor Excel / CSV</Button><Button type="button" variant="ghost" size="sm" className="gap-2" onClick={downloadStoreImportTemplate}><Download className="size-4" />Unduh template</Button></div><p className="mb-4 text-xs leading-5 text-muted-foreground">Kolom wajib: <strong>Nomor_Toko</strong>. Kolom opsional: <strong>Alamat_Pengiriman</strong>. Gunakan satu alamat yang sama untuk semua toko.</p><div className="grid gap-4"><div className="space-y-1.5"><Label htmlFor="bulk-stores">Nomor toko</Label><Textarea id="bulk-stores" className="min-h-44 font-mono text-sm" value={storeNumbersText} onChange={event => setStoreNumbersText(event.target.value)} placeholder={"Toko 01\nToko 02\nToko 03"} /><p className="text-xs text-muted-foreground">{storeNumbers.length} toko akan dibuat.</p></div><div className="space-y-1.5"><Label htmlFor="bulk-shipping">Alamat gudang / pengiriman</Label><Textarea id="bulk-shipping" className="min-h-24" value={shippingAddress} onChange={event => setShippingAddress(event.target.value)} placeholder="Contoh: Gudang pusat, Jl. Distribusi No. 10, Jakarta" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Tanggal invoice</Label><Input type="date" value={invoiceDate} onChange={event => setInvoiceDate(event.target.value)} /></div><div className="space-y-1.5"><Label>Jatuh tempo</Label><Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></div></div></div></CardContent></Card></div>
      <aside className="lg:sticky lg:top-24 lg:h-fit"><Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.13em] text-primary">Ringkasan</p><h2 className="mt-2 text-xl font-bold">{storeNumbers.length} invoice baru</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Setiap toko memperoleh nomor invoice unik, status draft, dan alamat pengiriman gudang yang sama. Invoice sumber tidak akan diubah.</p><Button className="mt-6 w-full gap-2" disabled={create.isPending || !invoices.data?.length} onClick={submit}><Layers3 className="size-4" />{create.isPending ? "Membuat invoice…" : "Buat invoice massal"}</Button></CardContent></Card></aside></div></>;
}
