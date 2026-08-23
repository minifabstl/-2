ALTER TABLE `users` ADD `notify_on_approval` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_on_rejection` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_on_comment` integer DEFAULT true NOT NULL;