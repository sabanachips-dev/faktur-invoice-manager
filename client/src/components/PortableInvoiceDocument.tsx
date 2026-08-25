import { formatDate, formatMoney } from "@/lib/format";
import { labelFulfillmentStatus } from "@shared/invoice";
import type { InvoiceDocumentData } from "@/components/InvoiceDocument";

export default function PortableInvoiceDocument({ data, documentId = "invoice-portable" }: { data: InvoiceDocumentData; documentId?: string }) {
  const { invoice, client, business, items } = data;
  const tone = business.accentColor || "#0C2B63";

  return (
    <article id={documentId} className="invoice-portable mx-auto w-[74mm] bg-white p-[3mm] text-[10px] leading-[1.35] text-slate-800" style={{ borderTop: `2mm solid ${tone}` }}>
      <header className="border-b border-dashed border-slate-300 pb-2 text-center">
        <div className="mx-auto grid size-8 place-items-center overflow-hidden rounded-md bg-slate-100 text-sm font-bold" style={{ color: tone }}>
          {business.logoUrl ? <img src={business.logoUrl} alt={`Logo ${business.businessName}`} className="size-full object-cover" /> : business.businessName.slice(0, 1).toUpperCase()}
        </div>
        <h1 className="mt-1.5 text-sm font-extrabold text-slate-950">{business.businessName}</h1>
        {business.address && <p className="mt-1 break-words text-[8px] text-slate-600">{business.address}</p>}
        {business.phone && <p className="mt-0.5 text-[8px] text-slate-600">{business.phone}</p>}
        <h2 className="mt-2 text-base font-black tracking-[.12em]" style={{ color: tone }}>INVOICE</h2>
      </header>

      <section className="grid grid-cols-2 gap-x-2 gap-y-1 border-b border-dashed border-slate-300 py-2 text-[8px]">
        <p><span className="block uppercase tracking-[.08em] text-slate-500">Nomor</span><span className="font-bold text-slate-800">{invoice.invoiceNumber}</span></p>
        <p className="text-right"><span className="block uppercase tracking-[.08em] text-slate-500">Tanggal</span><span className="font-bold text-slate-800">{formatDate(invoice.invoiceDate)}</span></p>
        <p className="col-span-2"><span className="block uppercase tracking-[.08em] text-slate-500">Untuk</span><span className="font-bold text-slate-800">{client.name}</span>{client.phone && <span className="ml-1 text-slate-600">· {client.phone}</span>}</p>
        {invoice.storeNumber && <p className="col-span-2"><span className="block uppercase tracking-[.08em] text-slate-500">Toko</span><span className="font-semibold text-slate-800">{invoice.storeNumber}</span></p>}
      </section>

      <table className="w-full border-collapse text-left text-[8px]"><thead className="border-b border-slate-500 text-[7px] font-bold uppercase tracking-[.06em] text-slate-600"><tr><th className="py-1.5 pr-1">Item</th><th className="w-7 py-1.5 text-center">Qty</th><th className="w-20 py-1.5 text-right">Jumlah</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.description}-${index}`} className="border-b border-dotted border-slate-300 align-top"><td className="py-1.5 pr-1 font-medium break-words">{item.description}{item.discount ? <span className="mt-0.5 block text-[7px] text-emerald-700">Diskon −{formatMoney(item.discount, invoice.currency)}</span> : null}</td><td className="py-1.5 text-center">{item.quantity}</td><td className="py-1.5 text-right font-semibold">{formatMoney(item.subtotal, invoice.currency)}</td></tr>)}</tbody></table>

      <section className="ml-auto mt-2 w-[46mm] text-[9px]"><p className="flex justify-between"><span>Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span></p>{invoice.discount > 0 && <p className="mt-1 flex justify-between"><span>Diskon</span><span>−{formatMoney(invoice.discount, invoice.currency)}</span></p>}<p className="mt-1 flex justify-between"><span>Pajak</span><span>{formatMoney(invoice.taxAmount, invoice.currency)}</span></p><p className="mt-1.5 flex justify-between border-t-2 pt-1.5 text-[12px] font-black" style={{ borderColor: tone, color: tone }}><span>TOTAL</span><span>{formatMoney(invoice.total, invoice.currency)}</span></p></section>

      {(business.bankName || business.bankAccountNumber) && <section className="mt-3 border-t border-dashed border-slate-300 pt-2 text-center text-[8px]"><p className="font-bold uppercase tracking-[.08em] text-slate-600">Pembayaran</p><p className="mt-1 font-semibold">{business.bankName || "Rekening pembayaran"}</p><p>{business.bankAccountNumber}{business.bankAccountName ? ` a/n ${business.bankAccountName}` : ""}</p></section>}
      {invoice.fulfillmentStatus && <p className="mt-3 text-center text-[8px] text-slate-600">Status pesanan: {labelFulfillmentStatus(invoice.fulfillmentStatus)}{invoice.courierName && invoice.trackingNumber ? ` · ${invoice.courierName} ${invoice.trackingNumber}` : ""}</p>}
      <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-center text-[8px] text-slate-500">Terima kasih atas kepercayaan Anda.</p>
    </article>
  );
}
