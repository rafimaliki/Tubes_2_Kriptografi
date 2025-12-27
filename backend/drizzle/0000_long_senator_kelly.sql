CREATE TABLE "ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"previous_hash" text NOT NULL,
	"current_hash" text NOT NULL,
	"transaction_type" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
