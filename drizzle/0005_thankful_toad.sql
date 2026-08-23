ALTER TABLE `posts` ADD `week_view_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `week_start_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `verified_creator` integer DEFAULT false NOT NULL;