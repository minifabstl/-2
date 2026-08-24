CREATE TABLE `search_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
