import type { InvoiceStatus } from "@shared/invoice";
import { Badge } from "@/components/ui/badge";
import { labelStatus } from "@/lib/format";

const styles: Record<InvoiceStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  sent: "border-blue-100 bg-blue-50 text-blue-700",
  unpaid: "border-amber-100 bg-amber-50 text-amber-700",
  paid: "border-emerald-100 bg-emerald-50 text-emerald-700",
  overdue: "border-rose-100 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant="outline" className={`whitespace-nowrap border px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}>{labelStatus(status)}</Badge>;
}

