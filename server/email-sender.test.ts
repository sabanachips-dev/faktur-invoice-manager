import { afterEach, describe, expect, it, vi } from "vitest";
import { sendInvoiceEmail } from "./email";

const fromEmail = process.env.RESEND_FROM_EMAIL || "";
const fromDomain = fromEmail.split("@").at(-1);

describe("email sender configuration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses a sender domain registered with Resend", async () => {
    expect(fromEmail, "RESEND_FROM_EMAIL must be configured").toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    expect(response.ok, "Resend domains endpoint should be reachable").toBe(true);
    const payload = await response.json() as { data?: { name?: string; status?: string }[] };
    const senderDomain = payload.data?.find(domain => domain.name === fromDomain);
    expect(senderDomain, "RESEND_FROM_EMAIL must use a domain registered with Resend").toBeTruthy();
    expect(senderDomain?.status, "Sender domain must be verified in Resend").toBe("verified");
  }, 15_000);

  it("submits the configured sender and client recipient to the email provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendInvoiceEmail({
      publicLink: "https://example.com/p/public123",
      invoice: {
        invoice: { id: 1, invoiceNumber: "INV-2026-001", invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "sent", currency: "IDR", subtotal: 100000, discount: 0, taxRate: 11, taxAmount: 11000, total: 111000, notes: null, publicId: "public123" },
        client: { name: "Klien Uji", email: "client@example.com", address: null, phone: null },
        business: { businessName: "Bisnis Anda", address: null, email: null, phone: null, bankName: null, bankAccountName: null, bankAccountNumber: null, logoUrl: null, accentColor: "#0C2B63", invoiceTemplate: "clean" },
        items: [],
      },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body.from).toBe(process.env.RESEND_FROM_EMAIL);
    expect(body.to).toEqual(["client@example.com"]);
    expect(body.html).toContain("https://example.com/p/public123");
  });
});
