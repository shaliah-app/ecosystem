CREATE TABLE "job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "job_queue_status_idx" ON "job_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_queue_run_at_idx" ON "job_queue" USING btree ("run_at");--> statement-breakpoint
CREATE INDEX "job_queue_priority_idx" ON "job_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "job_queue_type_idx" ON "job_queue" USING btree ("type");