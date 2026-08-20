ALTER TABLE `invoices` ADD `discountType` enum('amount','percentage') DEFAULT 'amount' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `discountValue` int DEFAULT 0 NOT NULL;