CREATE TABLE `models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`photo_key` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_slug_unique` ON `models` (`slug`);