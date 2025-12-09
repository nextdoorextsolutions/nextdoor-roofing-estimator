ALTER TABLE `leads` ADD `status` enum('new','contacted','quoted','won','lost') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `notes` text;