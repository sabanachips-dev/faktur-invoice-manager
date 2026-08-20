ALTER TABLE `invoices` ADD `bulkBatchId` varchar(32);--> statement-breakpoint
ALTER TABLE `invoices` ADD `isBatchSummary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `invoice_user_batch_idx` ON `invoices` (`userId`,`bulkBatchId`);