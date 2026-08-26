import { useSupabaseAuth } from "@/_core/hooks/useSupabaseAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SupabaseLoginCard } from "@/components/SupabaseLoginCard";
import { navigateBack } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, FileText, LayoutDashboard, LogOut, MapPinned, Menu, PanelsTopLeft, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileText, label: "Invoice", path: "/invoice" },
  { icon: PanelsTopLeft, label: "Pesanan", path: "/orders" },
  { icon: MapPinned, label: "Pengiriman", path: "/shipping" },
  { icon: Users, label: "Klien", path: "/clients" },
  { icon: BookOpen, label: "Katalog", path: "/catalog" },
  { icon: Settings, label: "Pengaturan", path: "/settings" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useSupabaseAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspace = trpc.organizations.current.useQuery(undefined, { enabled: Boolean(user) });

  if (loading) {
    return <div className="min-h-screen app-surface grid place-items-center text-sm text-muted-foreground">Memuat ruang kerja…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen app-surface grid place-items-center px-5">
        <SupabaseLoginCard />
      </div>
    );
  }

  const navigate = (path: string) => { setLocation(path); setMobileOpen(false); };
  const goBack = () => navigateBack({ historyLength: window.history.length, fallbackPath: "/", goToHistory: () => window.history.back(), goToFallback: navigate });
  const SidebarContent = () => (
    <>
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">F</div>
        <div><p className="font-bold tracking-tight">Faktur</p><p className="text-xs text-muted-foreground">Invoice manager</p></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Menu utama">
        {menuItems.map(item => {
          const active = location === item.path || (item.path === "/invoice" && location.startsWith("/invoice"));
          return <button key={item.path} onClick={() => navigate(item.path)} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${active ? "bg-[#e7eefc] text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            <item.icon className="size-[18px]" /><span>{item.label}</span>
          </button>;
        })}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar className="size-9 border"><AvatarFallback className="bg-slate-100 text-xs font-bold text-primary">{user.name.slice(0, 2).toUpperCase() || "BU"}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name || "Pemilik bisnis"}</p><p className="truncate text-xs text-muted-foreground">{user.email || "Akun bisnis"}</p></div>
          <button onClick={logout} aria-label="Keluar" className="rounded-md p-2 text-muted-foreground hover:bg-slate-100 hover:text-destructive"><LogOut className="size-4" /></button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex"><SidebarContent /></aside>
      <div className={`fixed inset-0 z-40 bg-slate-950/25 transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMobileOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button className="absolute right-4 top-7 rounded-md p-1 text-muted-foreground hover:bg-slate-100" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X className="size-5" /></button><SidebarContent />
      </aside>
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white/90 px-4 backdrop-blur lg:px-8">
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu className="size-5" /></button>
          {location !== "/" && <button className="ml-1 inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900" onClick={goBack}><ArrowLeft className="size-4" />Kembali</button>}
          <div className="ml-auto max-w-[13rem] truncate text-right text-xs font-medium text-muted-foreground" title={workspace.data?.name || "Ruang kerja bisnis"}>{workspace.data?.name || "Ruang kerja bisnis"}</div>
        </header>
        <div className="mx-auto w-full max-w-[1540px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
