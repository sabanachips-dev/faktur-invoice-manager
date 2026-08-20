import type { InvoiceDocumentData } from "../client/src/components/InvoiceDocument";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export async function sendInvoiceEmail({
  invoice,
  publicLink,
}: {
  invoice: InvoiceDocumentData;
  publicLink: string;
}) {
  if (!invoice.client.email) throw new Error("Klien belum memiliki alamat email.");
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Layanan email belum dikonfigurasi.");

  const subject = `Invoice ${invoice.invoice.invoiceNumber} dari ${invoice.business.businessName}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [invoice.client.email],
      subject,
      html: `<main style="font-family:Arial,sans-serif;color:#18233a;max-width:560px;margin:0 auto;padding:28px"><h1 style="font-size:24px;margin:0 0 16px">Invoice ${escapeHtml(invoice.invoice.invoiceNumber)}</h1><p>Halo ${escapeHtml(invoice.client.name)},</p><p>${escapeHtml(invoice.business.businessName)} telah mengirimkan invoice senilai <strong>${new Intl.NumberFormat("id-ID", { style: "currency", currency: invoice.invoice.currency, maximumFractionDigits: 0 }).format(invoice.invoice.total)}</strong>.</p><p>Jatuh tempo: <strong>${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(invoice.invoice.dueDate)}</strong>.</p><p style="margin:28px 0"><a href="${escapeHtml(publicLink)}" style="background:#0C2B63;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Lihat invoice</a></p><p style="font-size:13px;color:#64748b">Jika tombol tidak terbuka, salin tautan ini:<br/>${escapeHtml(publicLink)}</p></main>`,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email tidak dapat dikirim (${response.status}): ${body.slice(0, 140)}`);
  }
  return (await response.json()) as { id: string };
}

