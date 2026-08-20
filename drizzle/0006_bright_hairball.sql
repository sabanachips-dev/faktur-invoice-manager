CREATE TABLE `invoiceActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`action` varchar(48) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `invoice_activity_user_created_idx` ON `invoiceActivities` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `invoice_activity_invoice_created_idx` ON `invoiceActivities` (`invoiceId`,`createdAt`);