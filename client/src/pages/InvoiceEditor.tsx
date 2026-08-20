import PageHeader from "@/components/PageHeader";
import QuickClientDialog from "@/components/QuickClientDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateInvoiceAmounts, type DiscountType } from "@shared/invoice";
import { trpc } from "@/lib/trpc";
import { formatMoney, toDateInput } from "@/lib/format";
import { CalendarDays, ChevronLeft, CircleX, Plus, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

type Line = { id: string; catalogItemId?: number | null; description: string; quantity: number; unitPrice: number };
const newLine = (): Line => ({ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 });

export default function InvoiceEditor() {
  const [, params] = useRoute("/invoice/:id");
  const invoiceId = params?.id && params.id !== "new" ? Number(params.id) : undefined;
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const clients = trpc.clients.list.useQuery({});
  const catalog = trpc.catalog.list.useQuery({});
  const business = trpc.business.get.useQuery();
  const number = trpc.invoices.nextNumber.useQuery(undefined, { enabled: !invoiceId });
  const existing = trpc.invoices.get.useQuery({ id: invoiceId || 1 }, { enabled: Boolean(invoiceId) });
  const [initialized, setInitialized] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(""); const [clientId, setClientId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(toDateInput(new Date())); const [dueDate, setDueDate] = useState(toDateInput(new Date(Date.now() + 14 * 86400000)));
  const [discountType, setDiscountType] = useState<DiscountType>("amount"); const [discountValue, setDiscountValue] = useState(0); const [taxRate, setTaxRate] = useState(11); const [currency, setCurrency] = useState("IDR"); const [notes, setNotes] = useState(""); const [items, setItems] = useState<Line[]>([newLine()]);

  useEffect(() => { if (!invoiceId && number.data) setInvoiceNumber(number.data); }, [invoiceId, number.data]);
  useEffect(() => { if (!invoiceId && business.data) { setTaxRate(business.data.defaultTaxRate); setCurrency(business.data.defaultCurrency); } }, [invoiceId, business.data]);
  useEffect(() => { if (invoiceId && existing.data && !initialized) { const { invoice, items: invoiceItems } = existing.data; setInvoiceNumber(invoice.invoiceNumber); setClientId(String(invoice.clientId)); setInvoiceDate(toDateInput(invoice.invoiceDate)); setDueDate(toDateInput(invoice.dueDate)); setDiscountType(invoice.discountType); setDiscountValue(invoice.discountValue); setTaxRate(invoice.taxRate); setCurrency(invoice.currency); setNotes(invoice.notes || ""); setItems(invoiceItems.map(item => ({ id: String(item.id), catalogItemId: item.catalogItemId, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }))); setInitialized(true); } }, [invoiceId, existing.data, initialized]);
  const amounts = useMemo(() => calculateInvoiceAmounts(items, discountValue, taxRate, discountType), [items, discountValue, taxRate, discountType]);
  const createInvoice = trpc.invoices.create.useMutation();
  const updateInvoice = trpc.invoices.update.useMutation();
  const isSaving = createInvoice.isPending || updateInvoice.isPending;
  const loading = clients.isLoading || catalog.isLoading || business.isLoading || (Boolean(invoiceId) && existing.isLoading);
  const setLine = (id: string, patch: Partial<Line>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  const chooseCatalog = (id: string, description: string) => { const match = catalog.data?.find(item => item.name.toLowerCase() === description.trim().toLowerCase()); if (match) setLine(id, { description: match.name, catalogItemId: match.id, unitPrice: match.defaultPrice }); };
  const save = (status: "draft" | "sent") => {
    if (!clientId) { toast.error("Pilih atau tambahkan klien terlebih dahulu."); return; }
    const validItems = items.filter(item => item.description.trim());
    if (!validItems.length) { toast.error("Tambahkan setidaknya satu item invoice."); return; }
    const data = {
      clientId: Number(clientId),
      invoiceNumber,
      invoiceDate: new Date(`${invoiceDate}T12:00:00`),
      dueDate: new Date(`${dueDate}T12:00:00`),
      status,
      currency,
      discountType,
      discountValue: Math.round(discountValue),
      taxRate: Math.round(taxRate),
      notes: notes || null,
      items: validItems.map(item => ({
        catalogItemId: item.catalogItemId || null,
        description: item.description.trim(),
        quantity: Math.max(1, Math.round(item.quantity)),
        unitPrice: Math.max(0, Math.round(item.unitPrice)),
      })),
    };
    const onSaved = (id: number) => { utils.invoices.list.invalidate(); utils.dashboard.get.invalidate(); toast.success(status === "draft" ? "Invoice disimpan sebagai draft." : "Invoice ditandai terkirim."); setLocation(`/invoice/${id}/preview`); };
    const onError = (error: { message: string }) => toast.error(error.message);
    if (invoiceId) updateInvoice.mutate({ id: invoiceId, data }, { onSuccess: () => onSaved(invoiceId), onError }); else createInvoice.mutate(data, { onSuccess: onSaved, onError });
  };

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Memuat editor invoice…</div>;
  return <><PageHeader eyebrow={invoiceId ? "Edit invoice" : "Invoice baru"} title={invoiceId ? "Edit invoice" : "Buat invoice baru"} description="Lengkapi informasi klien dan item; nilai tagihan akan dihitung otomatis." action={<Button variant="ghost" className="gap-2" onClick={() => setLocation("/invoice")}><ChevronLeft className="size-4" />Kembali</Button>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-6"><Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Informasi invoice</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Draft</span></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Nomor invoice</Label><Input value={invoiceNumber} onChange={event => setInvoiceNumber(event.target.value)} placeholder="INV-2026-001" /></div><div className="space-y-1.5"><Label>Mata uang</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IDR">IDR — Rupiah</SelectItem><SelectItem value="USD">USD — Dollar AS</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Tanggal invoice</Label><Input type="date" value={invoiceDate} onChange={event => setInvoiceDate(event.target.value)} /></div><div className="space-y-1.5"><Label>Tanggal jatuh tempo</Label><Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></div></div></CardContent></Card>
      <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Ditagihkan kepada</h2><p className="mt-1 text-sm text-muted-foreground">Pilih klien yang sudah tersimpan atau tambah baru.</p></div><QuickClientDialog onCreated={id => setClientId(String(id))} /></div><Select value={clientId} onValueChange={setClientId}><SelectTrigger className="h-11"><SelectValue placeholder="Pilih klien" /></SelectTrigger><SelectContent>{clients.data?.map(client => <SelectItem key={client.id} value={String(client.id)}>{client.name}{client.email ? ` — ${client.email}` : ""}</SelectItem>)}</SelectContent></Select></CardContent></Card>
      <Card className="border-slate-200/80"><CardContent className="p-0"><div className="flex items-center justify-between p-5 sm:p-6"><div><h2 className="font-bold">Item tagihan</h2><p className="mt-1 text-sm text-muted-foreground">Pilih dari katalog atau masukkan deskripsi sendiri.</p></div><Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setItems(current => [...current, newLine()])}><Plus className="size-4" />Tambah item</Button></div><datalist id="catalog-options">{catalog.data?.map(item => <option key={item.id} value={item.name} />)}</datalist><div className="overflow-x-auto border-t"><table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[.09em] text-muted-foreground"><tr><th className="px-5 py-3 text-left">Deskripsi</th><th className="w-24 px-2 py-3 text-center">Qty</th><th className="w-40 px-3 py-3 text-right">Harga satuan</th><th className="w-36 px-3 py-3 text-right">Subtotal</th><th className="w-12 px-3 py-3" /></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-3"><Input list="catalog-options" value={item.description} onChange={event => setLine(item.id, { description: event.target.value, catalogItemId: null })} onBlur={event => chooseCatalog(item.id, event.target.value)} placeholder="Contoh: Jasa desain website" className="border-transparent bg-transparent px-0 shadow-none focus-visible:border-input focus-visible:px-3" /></td><td className="px-2 py-3"><Input type="number" min="1" value={item.quantity} onChange={event => setLine(item.id, { quantity: Number(event.target.value) || 1 })} className="text-center" /></td><td className="px-3 py-3"><Input type="number" min="0" value={item.unitPrice} onChange={event => setLine(item.id, { unitPrice: Number(event.target.value) || 0 })} className="text-right" /></td><td className="px-3 py-3 text-right font-semibold">{formatMoney(item.quantity * item.unitPrice, currency)}</td><td className="px-3 py-3"><Button type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems(current => current.filter(line => line.id !== item.id))}><Trash2 className="size-4 text-rose-500" /></Button></td></tr>)}</tbody></table></div></CardContent></Card>
      <Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><Label htmlFor="invoice-notes">Catatan atau syarat pembayaran</Label><Textarea id="invoice-notes" className="mt-2 min-h-24" placeholder="Contoh: Mohon lakukan pembayaran maksimal 14 hari setelah invoice diterima." value={notes} onChange={event => setNotes(event.target.value)} /></CardContent></Card>
    </div><aside className="xl:sticky xl:top-24 xl:h-fit"><Card className="border-slate-200/80"><CardContent className="p-5 sm:p-6"><h2 className="font-bold">Ringkasan pembayaran</h2><div className="mt-6 space-y-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Subtotal</span><strong className="font-semibold text-slate-800">{formatMoney(amounts.subtotal, currency)}</strong></div><div className="space-y-2"><Label className="text-sm font-normal text-muted-foreground">Diskon</Label><div className="flex gap-2"><Select value={discountType} onValueChange={value => { const type = value as DiscountType; setDiscountType(type); setDiscountValue(current => type === "percentage" ? Math.min(current, 100) : current); }}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="amount">Nominal</SelectItem><SelectItem value="percentage">Persen (%)</SelectItem></SelectContent></Select><Input className="flex-1 text-right" type="number" min="0" max={discountType === "percentage" ? 100 : undefined} value={discountValue} onChange={event => { const value = Number(event.target.value) || 0; setDiscountValue(discountType === "percentage" ? Math.min(value, 100) : value); }} /></div>{discountType === "percentage" && <p className="text-xs text-muted-foreground">Potongan: {formatMoney(amounts.discount, currency)} dari subtotal.</p>}</div><div className="flex items-center justify-between gap-4"><Label className="text-sm font-normal text-muted-foreground">Pajak (%)</Label><Input className="w-24 text-right" type="number" min="0" max="100" value={taxRate} onChange={event => setTaxRate(Number(event.target.value) || 0)} /></div><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Pajak</span><strong className="font-semibold text-slate-800">{formatMoney(amounts.taxAmount, currency)}</strong></div></div><div className="mt-6 border-t-2 border-primary pt-5"><div className="flex items-end justify-between"><span className="font-bold">Total</span><strong className="text-2xl font-bold tracking-tight text-primary">{formatMoney(amounts.total, currency)}</strong></div></div><div className="mt-7 grid gap-2"><Button variant="outline" className="gap-2" onClick={() => save("draft")} disabled={isSaving}><Save className="size-4" />Simpan sebagai draft</Button><Button className="gap-2" onClick={() => save("sent")} disabled={isSaving}><Send className="size-4" />Preview & kirim</Button></div></CardContent></Card></aside></div>
  </>;
}
