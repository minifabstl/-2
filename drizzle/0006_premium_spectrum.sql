ALTER TABLE `users` ADD `active_seconds` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_milestone_reached_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `gift_sent_at` integer;