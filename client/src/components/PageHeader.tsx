import type { ReactNode } from "react";

export default function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
      <h1 className="page-title text-3xl font-bold text-slate-950">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
    {action}
  </div>;
}

