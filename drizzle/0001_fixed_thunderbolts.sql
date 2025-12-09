CREATE TABLE `estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`totalRoofArea` int,
	`averagePitch` int,
	`eaveLength` int,
	`ridgeValleyLength` int,
	`adjustedArea` int,
	`hasPitchSurcharge` boolean DEFAULT false,
	`goodPrice` int,
	`betterPrice` int,
	`bestPrice` int,
	`selectedTier` enum('good','better','best'),
	`status` enum('pending','manual_quote','completed') DEFAULT 'pending',
	`satelliteImageUrl` text,
	`solarApiAvailable` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
