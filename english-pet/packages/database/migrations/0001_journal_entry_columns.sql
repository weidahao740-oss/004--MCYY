ALTER TABLE "journal_entries" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "title_zh" text;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "event_key" text;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "pronunciation_note" text;
