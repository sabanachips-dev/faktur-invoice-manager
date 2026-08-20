CREATE TABLE `businessProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`address` text,
	`email` varchar(320),
	`phone` varchar(50),
	`bankName` varchar(100),
	`bankAccountName` varchar(255),
	`bankAccountNumber` varchar(100),
	`logoUrl` text,
	`accentColor` varchar(16) NOT NULL DEFAULT '#0C2B63',
	`invoiceTemplate` enum('clean','modern','classic') NOT NULL DEFAULT 'clean',
	`invoiceNumberFormat` varchar(80) NOT NULL DEFAULT 'INV-{YYYY}-{SEQ}',
	`defaultTaxRate` int NOT NULL DEFAULT 11,
	`defaultCurrency` varchar(3) NOT NULL DEFAULT 'IDR',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `businessProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `catalogItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`defaultPrice` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalogItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`address` text,
	`phone` varchar(50),
	`taxId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`catalogItemId` int,
	`description` varchar(500) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` int NOT NULL DEFAULT 0,
	`subtotal` int NOT NULL DEFAULT 0,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`invoiceNumber` varchar(80) NOT NULL,
	`invoiceDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`status` enum('draft','sent','unpaid','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`currency` varchar(3) NOT NULL DEFAULT 'IDR',
	`subtotal` int NOT NULL DEFAULT 0,
	`discount` int NOT NULL DEFAULT 0,
	`taxRate` int NOT NULL DEFAULT 0,
	`taxAmount` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`notes` text,
	`publicId` varchar(32) NOT NULL,
	`sentAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_publicId_unique` UNIQUE(`publicId`),
	CONSTRAINT `invoice_user_number_unique` UNIQUE(`userId`,`invoiceNumber`)
);
