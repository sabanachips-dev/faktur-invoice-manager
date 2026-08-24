import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/format";
import { BadgePercent, Box, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CatalogDiscountType = "none" | "amount" | "percentage";
type CatalogItem = { id: number; name: string; description: string | null; defaultPrice: number; discountType?: CatalogDiscountType; discountValue?: number };
type CatalogForm = { name: string; description: string; defaultPrice: number; discountType: CatalogDiscountType; discountValue: number };
const emptyItem: CatalogForm = { name: "", description: "", defaultPrice: 0, discountType: "none", discountValue: 0 };

function promoLabel(item: Pick<CatalogForm, "discountType" | "discountValue">) {
  if (item.discountType === "percentage") return `Promo ${item.discountValue}%`;
  if (item.discountType === "amount") return `Potongan ${formatMoney(item.discountValue)}/unit`;
  return null;
}

export default function Catalog() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CatalogItem | "new" | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyItem);
  const utils = trpc.useUtils();
  const catalog = trpc.catalog.list.useQuery({ query });
  const close = () => { setEditing(null); setForm(emptyItem); };
  const create = trpc.catalog.create.useMutation({ onSuccess: () => { utils.catalog.list.invalidate(); toast.success("Item katalog ditambahkan."); close(); }, onError: error => toast.error(error.message) });
  const update = trpc.catalog.update.useMutation({ onSuccess: () => { utils.catalog.list.invalidate(); toast.success("Item katalog diperbarui."); close(); }, onError: error => toast.error(error.message) });
  const remove = trpc.catalog.remove.useMutation({ onSuccess: () => { utils.catalog.list.invalidate(); toast.success("Item katalog dihapus."); }, onError: error => toast.error(error.message) });
  const openNew = () => { setEditing("new"); setForm(emptyItem); };
  const openEdit = (item: CatalogItem) => { setEditing(item); setForm({ name: item.name, description: item.description || "", defaultPrice: item.defaultPrice, discountType: item.discountType || "none", discountValue: Number(item.discountValue || 0) }); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const discountValue = form.discountType === "none" ? 0 : Math.max(0, Math.round(form.discountValue));
    if (form.discountType === "percentage" && discountValue > 100) { toast.error("Promo persentase maksimal 100%."); return; }
    if (form.discountType === "amount" && discountValue > form.defaultPrice) { toast.error("Potongan per unit tidak boleh melebihi harga default."); return; }
    const data = { ...form, description: form.description || null, defaultPrice: Math.max(0, Math.round(form.defaultPrice)), discountValue };
    if (editing === "new") create.mutate(data); else if (editing) update.mutate({ id: editing.id, data });
  };

  return <>
    <PageHeader eyebrow="Daftar harga" title="Katalog" description="Simpan produk dan jasa agar dapat dipilih cepat saat membuat invoice." action={<Button className="gap-2" onClick={openNew}><Plus className="size-4" />Tambah item</Button>} />
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white"><div className="border-b p-4"><div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari produk atau jasa…" className="pl-9" /></div></div>{catalog.isLoading ? <div className="p-6 text-sm text-muted-foreground">Memuat katalog…</div> : !catalog.data?.length ? <div className="px-6 py-16 text-center"><Box className="mx-auto size-9 text-slate-300" /><h2 className="mt-4 font-bold">Katalog masih kosong</h2><p className="mt-1 text-sm text-muted-foreground">Tambahkan jasa atau produk untuk mempercepat pembuatan invoice.</p><Button className="mt-5" size="sm" onClick={openNew}>Tambah item</Button></div> : <div className="divide-y divide-slate-100">{(catalog.data as unknown as CatalogItem[]).map(item => { const label = promoLabel({ discountType: item.discountType || "none", discountValue: Number(item.discountValue || 0) }); return <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-primary"><Box className="size-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-800">{item.name}</p>{label && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"><BadgePercent className="size-3" />{label}</span>}</div><p className="mt-0.5 truncate text-sm text-muted-foreground">{item.description || "Tanpa deskripsi"}</p></div><p className="hidden text-right text-sm font-bold sm:block">{formatMoney(item.defaultPrice)}</p><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => { if (window.confirm(`Hapus ${item.name}?`)) remove.mutate({ id: item.id }); }}><Trash2 className="size-4 text-rose-600" /></Button></div></div>; })}</div>}</section>
    <Dialog open={editing !== null} onOpenChange={open => !open && close()}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editing === "new" ? "Tambah item katalog" : "Edit item katalog"}</DialogTitle><DialogDescription>Harga dan promo default akan terisi sebagai saran ketika item dipilih pada invoice.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div className="space-y-1.5"><Label>Nama item</Label><Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></div><div className="space-y-1.5"><Label>Deskripsi singkat</Label><Textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></div><div className="space-y-1.5"><Label>Harga default (Rp)</Label><Input type="number" min="0" value={form.defaultPrice} onChange={event => setForm({ ...form, defaultPrice: Number(event.target.value) || 0 })} /></div><div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3"><Label className="text-sm font-semibold text-emerald-900">Promo default</Label><p className="mt-1 text-xs text-emerald-800">Promo ini otomatis terisi pada invoice, tetapi masih dapat disesuaikan per item.</p><div className="mt-3 flex gap-2"><Select value={form.discountType} onValueChange={value => setForm({ ...form, discountType: value as CatalogDiscountType, discountValue: value === "none" ? 0 : form.discountValue })}><SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tidak ada</SelectItem><SelectItem value="percentage">Persen (%)</SelectItem><SelectItem value="amount">Nominal</SelectItem></SelectContent></Select><Input className="bg-white text-right" type="number" min="0" max={form.discountType === "percentage" ? 100 : form.defaultPrice} disabled={form.discountType === "none"} value={form.discountType === "none" ? 0 : form.discountValue} onChange={event => setForm({ ...form, discountValue: Number(event.target.value) || 0 })} /></div>{form.discountType === "amount" && <p className="mt-2 text-xs text-emerald-800">Nominal adalah potongan per unit.</p>}</div><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={close}>Batal</Button><Button type="submit" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Menyimpan…" : "Simpan item"}</Button></div></form></DialogContent></Dialog>
  </>;
}
