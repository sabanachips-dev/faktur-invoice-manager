import {
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const businessProfiles = mysqlTable("businessProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  address: text("address"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  bankAccountName: varchar("bankAccountName", { length: 255 }),
  bankAccountNumber: varchar("bankAccountNumber", { length: 100 }),
  logoUrl: text("logoUrl"),
  accentColor: varchar("accentColor", { length: 16 }).notNull().default("#0C2B63"),
  invoiceTemplate: mysqlEnum("invoiceTemplate", ["clean", "modern", "classic"])
    .notNull()
    .default("clean"),
  invoiceNumberFormat: varchar("invoiceNumberFormat", { length: 80 })
    .notNull()
    .default("INV-{YYYY}-{SEQ}"),
  defaultTaxRate: int("defaultTaxRate").notNull().default(11),
  defaultCurrency: varchar("defaultCurrency", { length: 3 }).notNull().default("IDR"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clients = mysqlTable(
  "clients",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    taxId: varchar("taxId", { length: 100 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("clients_user_created_idx").on(table.userId, table.createdAt)],
);

export const catalogItems = mysqlTable(
  "catalogItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    defaultPrice: int("defaultPrice").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("catalog_user_created_idx").on(table.userId, table.createdAt)],
);

export const invoiceStatusValues = [
  "draft",
  "sent",
  "unpaid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    clientId: int("clientId").notNull(),
    invoiceNumber: varchar("invoiceNumber", { length: 80 }).notNull(),
    invoiceDate: timestamp("invoiceDate").notNull(),
    dueDate: timestamp("dueDate").notNull(),
    status: mysqlEnum("status", invoiceStatusValues).notNull().default("draft"),
    currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
    subtotal: int("subtotal").notNull().default(0),
    discount: int("discount").notNull().default(0),
    discountType: mysqlEnum("discountType", ["amount", "percentage"]).notNull().default("amount"),
    discountValue: int("discountValue").notNull().default(0),
    taxRate: int("taxRate").notNull().default(0),
    taxAmount: int("taxAmount").notNull().default(0),
    total: int("total").notNull().default(0),
    notes: text("notes"),
    publicId: varchar("publicId", { length: 32 }).notNull().unique(),
    sentAt: timestamp("sentAt"),
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("invoice_user_number_unique").on(table.userId, table.invoiceNumber),
    index("invoice_user_date_idx").on(table.userId, table.invoiceDate),
    index("invoice_user_client_idx").on(table.userId, table.clientId),
  ],
);

export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  catalogItemId: int("catalogItemId"),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: int("unitPrice").notNull().default(0),
  subtotal: int("subtotal").notNull().default(0),
  position: int("position").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
