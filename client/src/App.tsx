import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Catalog from "@/pages/Catalog";
import Clients from "@/pages/Clients";
import Dashboard from "@/pages/Dashboard";
import InvoiceEditor from "@/pages/InvoiceEditor";
import BulkInvoice from "@/pages/BulkInvoice";
import ImportInvoices from "@/pages/ImportInvoices";
import InvoiceHistory from "@/pages/InvoiceHistory";
import InvoiceList from "@/pages/InvoiceList";
import InvoicePreview from "@/pages/InvoicePreview";
import OrdersBoard from "@/pages/OrdersBoard";
import NotFound from "@/pages/NotFound";
import PublicInvoice from "@/pages/PublicInvoice";
import Settings from "@/pages/Settings";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return <DashboardLayout><Component /></DashboardLayout>;
}

function Router() {
  return <Switch>
    <Route path="/p/:publicId" component={PublicInvoice} />
    <Route path="/" component={() => <ProtectedPage component={Dashboard} />} />
    <Route path="/invoice" component={() => <ProtectedPage component={InvoiceList} />} />
    <Route path="/invoice/new" component={() => <ProtectedPage component={InvoiceEditor} />} />
    <Route path="/invoice/bulk" component={() => <ProtectedPage component={BulkInvoice} />} />
    <Route path="/invoice/import" component={() => <ProtectedPage component={ImportInvoices} />} />
    <Route path="/invoice/history" component={() => <ProtectedPage component={InvoiceHistory} />} />
    <Route path="/invoice/:id/preview" component={() => <ProtectedPage component={InvoicePreview} />} />
    <Route path="/invoice/:id" component={() => <ProtectedPage component={InvoiceEditor} />} />
    <Route path="/orders" component={() => <ProtectedPage component={OrdersBoard} />} />
    <Route path="/clients" component={() => <ProtectedPage component={Clients} />} />
    <Route path="/catalog" component={() => <ProtectedPage component={Catalog} />} />
    <Route path="/settings" component={() => <ProtectedPage component={Settings} />} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
