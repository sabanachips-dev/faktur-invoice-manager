import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDate, formatMoney } from "@/lib/format";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, FileText, Layers3, PackageCheck, Plus, WalletCards } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocation } from "wouter";
import { useState } from "react";
import type { DashboardPeriod } from "@shared/dashboard";

const cardConfig = (periodLabel: string) => [
  { key: "monthTotal", count: "monthCount", label: `Invoice ${periodLabel}`, icon: FileText, tint: "bg-blue-50 text-blue-700" },
  { key: "unpaidTotal", count: "unpaidCount", label: "Belum dibayar", icon: Clock3, tint: "bg-amber-50 text-amber-700" },
  { key: "paidTotal", count: "paidCount", label: "Lunas", icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-700" },
  { key: "overdueTotal", count: "overdueCount", label: "Jatuh tempo", icon: AlertCircle, tint: "bg-rose-50 text-rose-700" },
] as const;

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<DashboardPeriod>("this_month");
  const dashboard = trpc.dashboard.get.useQuery({ period });
  const data = dashboard.data;

  return <>
    <PageHeader eyebrow="Ringkasan" title="Dashboard" description="Pantau kesehatan arus kas dan invoice bisnis Anda." action={<div className="flex flex-wrap gap-2"><Select value={period} onValueChange={value => setPeriod(value as DashboardPeriod)}><SelectTrigger className="w-[152px] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="this_month">Bulan ini</SelectItem><SelectItem value="last_month">Bulan lalu</SelectItem><SelectItem value="this_year">Tahun ini</SelectItem></SelectContent></Select><Button onClick={() => setLocation("/invoice/new")} className="gap-2"><Plus className="size-4" />Buat invoice baru</Button></div>} />
    {dashboard.isLoading || !data ? <DashboardSkeleton /> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardConfig(data.periodLabel).map(card => {
          const Icon = card.icon;
          const total = data.metrics[card.key];
          const count = data.metrics[card.count];
          return <Card key={card.key} className="stat-card border-slate-200/80 bg-white"><CardContent className="p-5">
            <div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${card.tint}`}><Icon className="size-5" /></div><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{count} invoice</span></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{formatMoney(total)}</p>
          </CardContent></Card>;
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="border-slate-200/80 bg-white"><CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-bold tracking-tight">Pendapatan masuk</h2><p className="mt-1 text-sm text-muted-foreground">Invoice yang telah dilunasi untuk {data.periodLabel}.</p></div><div className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowUpRight className="size-4" />{data.periodLabel}</div></div>
          <div className="mt-7 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.income} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}><defs><linearGradient id="income" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0C2B63" stopOpacity={0.2} /><stop offset="100%" stopColor="#0C2B63" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9edf4" /><XAxis dataKey="label" axisLine={false} tickLine={false} interval={period === "this_year" ? 0 : 4} tick={{ fill: "#7b879b", fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#7b879b", fontSize: 11 }} tickFormatter={value => value ? `${Math.round(value / 1_000_000)} jt` : "0"} /><Tooltip formatter={(value: number) => [formatMoney(value), "Pendapatan"]} contentStyle={{ borderRadius: 10, border: "1px solid #e5eaf2", boxShadow: "0 8px 24px rgba(12,43,99,.08)" }} /><Area type="monotone" dataKey="value" stroke="#0C2B63" strokeWidth={2.5} fill="url(#income)" /></AreaChart></ResponsiveContainer>
          </div>
        </CardContent></Card>
        <Card className="border-slate-200/80 bg-[#0c2b63] text-white"><CardContent className="flex h-full min-h-[320px] flex-col p-6"><div className="grid size-10 place-items-center rounded-xl bg-white/10"><WalletCards className="size-5" /></div><p className="mt-6 text-sm text-blue-100">Cepat mulai</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Kirim invoice berikutnya dalam beberapa langkah.</h2><p className="mt-3 text-sm leading-6 text-blue-100">Pilih klien, tambahkan item dari katalog, lalu kirim melalui tautan publik.</p><Button onClick={() => setLocation("/invoice/new")} variant="secondary" className="mt-auto w-full bg-white text-primary hover:bg-blue-50">Buat invoice</Button></CardContent></Card>
      </section>

      {data.batchRecaps.length > 0 && <section className="mt-6 rounded-xl border border-slate-200/80 bg-white"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6"><div><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-primary"><Layers3 className="size-4" /></div><h2 className="font-bold tracking-tight">Rekap invoice massal</h2></div><p className="mt-2 text-sm text-muted-foreground">Total seluruh toko dan kuantitas item dari batch invoice dalam {data.periodLabel}. Nilai rekap tidak dihitung dua kali pada kartu finansial di atas.</p></div><Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation("/invoice/bulk")}><Plus className="size-4" />Buat batch baru</Button></div><div className="divide-y divide-slate-100">{data.batchRecaps.map(recap => <div key={recap.invoice.id} className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><button className="font-semibold text-primary hover:underline" onClick={() => setLocation(`/invoice/${recap.invoice.id}/preview`)}>{recap.invoice.invoiceNumber}</button><p className="mt-1 text-sm text-slate-700">Rekap {recap.storeCount} toko · {recap.client.name}</p><p className="mt-1 text-xs text-muted-foreground">Tanggal invoice: {formatDate(recap.invoice.invoiceDate)}{recap.invoice.shippingAddress ? ` · ${recap.invoice.shippingAddress}` : ""}</p></div><div className="rounded-lg bg-slate-50 px-4 py-3 text-right"><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground">Total semua toko</p><p className="mt-1 font-bold text-slate-900">{formatMoney(recap.invoice.total, recap.invoice.currency)}</p></div></div><div className="mt-5 overflow-hidden rounded-lg border border-slate-200"><div className="flex items-center gap-2 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-slate-500"><PackageCheck className="size-3.5" />Rekap qty per item</div><div className="divide-y divide-slate-100">{recap.items.map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="font-medium text-slate-800">{item.description}</span><span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">{item.quantity} unit</span></div>)}</div></div></div>)}</div></section>}

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6"><div><h2 className="font-bold tracking-tight">Invoice terbaru</h2><p className="mt-1 text-sm text-muted-foreground">Invoice terbaru yang perlu Anda perhatikan.</p></div><Button variant="ghost" className="text-primary hover:bg-blue-50" onClick={() => setLocation("/invoice")}>Lihat semua</Button></div>
        {data.recent.length === 0 ? <div className="border-t px-6 py-12 text-center"><FileText className="mx-auto size-8 text-slate-300" /><p className="mt-3 font-semibold">Belum ada invoice</p><p className="mt-1 text-sm text-muted-foreground">Buat invoice pertama untuk mulai melacak tagihan.</p><Button className="mt-5" size="sm" onClick={() => setLocation("/invoice/new")}>Buat invoice</Button></div> : <div className="overflow-x-auto border-t"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground"><tr><th className="px-6 py-3.5">Nomor invoice</th><th className="px-4 py-3.5">Klien</th><th className="px-4 py-3.5">Jatuh tempo</th><th className="px-4 py-3.5 text-right">Jumlah</th><th className="px-6 py-3.5 text-right">Status</th></tr></thead><tbody>
          {data.recent.map(({ invoice, client }) => <tr key={invoice.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"><td className="px-6 py-4"><button onClick={() => setLocation(`/invoice/${invoice.id}/preview`)} className="font-semibold text-primary hover:underline">{invoice.invoiceNumber}</button></td><td className="px-4 py-4 font-medium text-slate-700">{client.name}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.dueDate)}</td><td className="px-4 py-4 text-right font-semibold text-slate-800">{formatMoney(invoice.total, invoice.currency)}</td><td className="px-6 py-4 text-right"><InvoiceStatusBadge status={invoice.status} /></td></tr>)}
        </tbody></table></div>}
      </section>
    </>}</>;
}

function DashboardSkeleton() { return <div className="space-y-6"><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-4 w-72" /></div><Skeleton className="h-10 w-40" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div><div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>; }
