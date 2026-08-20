import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { clients } from "../drizzle/schema";
import * as db from "./db";

const userId = 1;
const marker = `__delete_verification_${Date.now()}__`;
let clientId: number | undefined;

afterEach(async () => {
  if (!clientId) return;
  const database = await db.getDb();
  await database?.delete(clients).where(eq(clients.id, clientId));
  clientId = undefined;
});

describe("invoice deletion end-to-end", () => {
  it("removes an owned invoice and its items", async () => {
    const client = await db.createClient(userId, { name: marker, email: "delete-verification@example.com", address: null, phone: null, taxId: null });
    clientId = client.id;
    const invoiceId = await db.createInvoice(userId, {
      clientId: client.id, invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "draft", currency: "IDR",
      discountType: "amount", discountValue: 0, taxRate: 11, notes: null, items: [{ description: "Item sementara", quantity: 1, unitPrice: 100000 }],
    });
    await expect(db.deleteInvoice(userId, invoiceId)).resolves.toEqual({ deletedId: invoiceId });
    await expect(db.getInvoice(userId, invoiceId)).resolves.toBeUndefined();
  }, 30_000);
});
