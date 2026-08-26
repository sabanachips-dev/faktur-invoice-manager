import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Catalog = lazy(() => import("@/pages/Catalog"));
const Clients = lazy(() => import("@/pages/Clients"));
const InvoiceEditor = lazy(() => import("@/pages/InvoiceEditor"));
const BulkInvoice = lazy(() => import("@/pages/BulkInvoice"));
const ImportInvoices = lazy(() => import("@/pages/ImportInvoices"));
const InvoiceHistory = lazy(() => import("@/pages/InvoiceHistory"));
const InvoiceList = lazy(() => import("@/pages/InvoiceList"));
const InvoicePreview = lazy(() => import("@/pages/InvoicePreview"));
const OrdersBoard = lazy(() => import("@/pages/OrdersBoard"));
const ShippingTools = lazy(() => import("@/pages/ShippingTools"));
const PublicInvoice = lazy(() => import("@/pages/PublicInvoice"));
const Settings = lazy(() => import("@/pages/Settings"));
const InvitationAccept = lazy(() => import("@/pages/InvitationAccept"));

function PageLoading() {
  return <div className="py-16 text-center text-sm text-muted-foreground" role="status">Memuat halaman…</div>;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <DashboardLayout><Suspense fallback={<PageLoading />}>{children}</Suspense></DashboardLayout>;
}

function Router() {
  return <Switch>
    <Route path="/invite/:token" component={() => <Suspense fallback={<PageLoading />}><InvitationAccept /></Suspense>} />
    <Route path="/p/:publicId" component={() => <Suspense fallback={<PageLoading />}><PublicInvoice /></Suspense>} />
    <Route path="/" component={() => <ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/invoice" component={() => <ProtectedPage><InvoiceList /></ProtectedPage>} />
    <Route path="/invoice/new" component={() => <ProtectedPage><InvoiceEditor /></ProtectedPage>} />
    <Route path="/invoice/bulk" component={() => <ProtectedPage><BulkInvoice /></ProtectedPage>} />
    <Route path="/invoice/import" component={() => <ProtectedPage><ImportInvoices /></ProtectedPage>} />
    <Route path="/invoice/history" component={() => <ProtectedPage><InvoiceHistory /></ProtectedPage>} />
    <Route path="/invoice/:id/preview" component={() => <ProtectedPage><InvoicePreview /></ProtectedPage>} />
    <Route path="/invoice/:id" component={() => <ProtectedPage><InvoiceEditor /></ProtectedPage>} />
    <Route path="/orders" component={() => <ProtectedPage><OrdersBoard /></ProtectedPage>} />
    <Route path="/shipping" component={() => <ProtectedPage><ShippingTools /></ProtectedPage>} />
    <Route path="/clients" component={() => <ProtectedPage><Clients /></ProtectedPage>} />
    <Route path="/catalog" component={() => <ProtectedPage><Catalog /></ProtectedPage>} />
    <Route path="/settings" component={() => <ProtectedPage><Settings /></ProtectedPage>} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
