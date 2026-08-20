CREATE INDEX `catalog_user_created_idx` ON `catalogItems` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `clients_user_created_idx` ON `clients` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `invoice_user_date_idx` ON `invoices` (`userId`,`invoiceDate`);--> statement-breakpoint
CREATE INDEX `invoice_user_client_idx` ON `invoices` (`userId`,`clientId`);