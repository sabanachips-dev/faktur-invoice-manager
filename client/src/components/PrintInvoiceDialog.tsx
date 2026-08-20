import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { printInvoice, type PrintPaperSize } from "@/lib/printInvoice";
import { Printer, Radio, ReceiptText } from "lucide-react";
import { useState } from "react";

const paperOptions: { value: PrintPaperSize; label: string; description: string }[] = [
  { value: "a4", label: "A4", description: "Ukuran standar invoice dan dokumen bisnis." },
  { value: "letter", label: "Letter", description: "Ukuran 8,5 × 11 inci untuk kebutuhan internasional." },
  { value: "a5", label: "A5", description: "Ukuran ringkas untuk invoice portabel." },
  { value: "receipt80", label: "Struk 80 mm", description: "Untuk printer thermal dan printer portabel berukuran 80 mm." },
];

export default function PrintInvoiceDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false); const [paper, setPaper] = useState<PrintPaperSize>("a4");
  const option = paperOptions.find(item => item.value === paper)!;
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" size={compact ? "sm" : "default"} className="gap-2"><Printer className="size-4" />Cetak</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Cetak invoice</DialogTitle><DialogDescription>Pilih ukuran dokumen, lalu gunakan dialog sistem untuk memilih printer yang tersedia.</DialogDescription></DialogHeader><div className="grid gap-2 py-2">{paperOptions.map(item => <button key={item.value} type="button" onClick={() => setPaper(item.value)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${paper === item.value ? "border-primary bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}><div className={`grid size-9 place-items-center rounded-lg ${paper === item.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{item.value === "receipt80" ? <ReceiptText className="size-4" /> : <Radio className="size-4" />}</div><div className="flex-1"><p className="font-semibold">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description}</p></div>{paper === item.value && <span className="size-2 rounded-full bg-primary" />}</button>)}</div><div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">Pilihan printer:</strong> setelah klik Cetak, sistem operasi akan membuka daftar printer. Pilih printer kantor, printer USB, Bluetooth, atau printer portabel yang sudah tersambung ke perangkat Anda.</div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button className="gap-2" onClick={() => { printInvoice(paper); setOpen(false); }}><Printer className="size-4" />Cetak {option.label}</Button></div></DialogContent></Dialog>;
}

