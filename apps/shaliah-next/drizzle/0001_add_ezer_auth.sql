CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text,
	"language" text DEFAULT 'en-US' NOT NULL,
	"telegram_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_telegram_user_id_unique" UNIQUE("telegram_user_id")
);
--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_token" ON "auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_user_id" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_tokens_expires_at" ON "auth_tokens" USING btree ("expires_at") WHERE "auth_tokens"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_telegram_user_id" ON "user_profiles" USING btree ("telegram_user_id");--> statement-breakpoint