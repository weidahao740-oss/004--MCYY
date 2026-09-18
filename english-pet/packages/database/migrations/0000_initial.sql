CREATE TYPE "public"."account_kind" AS ENUM('guest', 'registered');--> statement-breakpoint
CREATE TYPE "public"."consent_decision" AS ENUM('granted', 'denied', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."consent_source" AS ENUM('onboarding', 'settings', 'memory_review');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('terms', 'privacy', 'memory_storage', 'voice_processing', 'analytics');--> statement-breakpoint
CREATE TYPE "public"."conversation_kind" AS ENUM('first_day', 'event', 'free_chat');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'paused', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."correction_preference" AS ENUM('after_conversation', 'only_when_blocking');--> statement-breakpoint
CREATE TYPE "public"."deletion_request_status" AS ENUM('requested', 'cooling_off', 'processing', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."event_definition_status" AS ENUM('draft', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."event_instance_status" AS ENUM('available', 'active', 'paused', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."event_transition_trigger" AS ENUM('continue', 'meaning_understood', 'meaning_ambiguous', 'clarification_resolved', 'choice_confirmed', 'user_declines', 'result_committed');--> statement-breakpoint
CREATE TYPE "public"."idempotency_status" AS ENUM('processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."identity_provider" AS ENUM('email', 'phone', 'wechat', 'apple');--> statement-breakpoint
CREATE TYPE "public"."journal_visibility" AS ENUM('visible', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."language_feedback_result" AS ENUM('successful', 'more_natural', 'affects_understanding');--> statement-breakpoint
CREATE TYPE "public"."language_level" AS ENUM('L1', 'L2', 'L3', 'L4');--> statement-breakpoint
CREATE TYPE "public"."memory_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."memory_kind" AS ENUM('life', 'language', 'relationship');--> statement-breakpoint
CREATE TYPE "public"."memory_revision_action" AS ENUM('propose', 'confirm', 'edit', 'pause', 'resume', 'reject', 'delete', 'expire');--> statement-breakpoint
CREATE TYPE "public"."memory_sensitivity" AS ENUM('normal', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('proposed', 'confirmed', 'paused', 'rejected', 'deleted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."message_input_mode" AS ENUM('text', 'voice', 'reference_reply', 'choice', 'system');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system', 'tool');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'accepted', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."relationship_stage" AS ENUM('NEW', 'FAMILIAR', 'TRUSTED', 'CLOSE');--> statement-breakpoint
CREATE TYPE "public"."reply_length" AS ENUM('short', 'standard');--> statement-breakpoint
CREATE TYPE "public"."resurfacing_mode" AS ENUM('optional_prompt', 'natural_modeling');--> statement-breakpoint
CREATE TYPE "public"."resurfacing_result" AS ENUM('used', 'paraphrased', 'ignored', 'declined', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."resurfacing_status" AS ENUM('pending', 'eligible', 'served', 'mastered', 'snoozed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."revision_actor" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TYPE "public"."speech_rate" AS ENUM('slow', 'normal');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deletion_pending', 'deleted');--> statement-breakpoint
CREATE TABLE "account_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "deletion_request_status" DEFAULT 'requested' NOT NULL,
	"scheduled_purge_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"failure_code" varchar(96),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"event_instance_id" uuid,
	"kind" "conversation_kind" NOT NULL,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"summary" text,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" varchar(96) NOT NULL,
	"version" varchar(32) NOT NULL,
	"ruleset_id" varchar(96) NOT NULL,
	"persona_version" varchar(64) NOT NULL,
	"prompt_version" varchar(64) NOT NULL,
	"output_schema_version" varchar(64) NOT NULL,
	"config_json" jsonb NOT NULL,
	"config_hash" varchar(64) NOT NULL,
	"status" "event_definition_status" DEFAULT 'draft' NOT NULL,
	"activated_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"event_definition_id" uuid NOT NULL,
	"event_key" varchar(96) NOT NULL,
	"event_version" varchar(32) NOT NULL,
	"ruleset_id" varchar(96) NOT NULL,
	"status" "event_instance_status" DEFAULT 'available' NOT NULL,
	"current_state_id" varchar(96) NOT NULL,
	"state_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"definition_snapshot" jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_idempotency_key" varchar(160),
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_instances_attempt_nonnegative" CHECK ("event_instances"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_instance_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"outcome_id" varchar(96) NOT NULL,
	"world_state_writes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effect_summary" text NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_transition_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_instance_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" uuid,
	"from_state_id" varchar(96),
	"to_state_id" varchar(96) NOT NULL,
	"trigger" "event_transition_trigger" NOT NULL,
	"guard_result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(160) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_instance_id" uuid,
	"scope" varchar(64) NOT NULL,
	"idempotency_key" varchar(160) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" "idempotency_status" DEFAULT 'processing' NOT NULL,
	"response_code" integer,
	"response_body" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"event_instance_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"what_happened" text NOT NULL,
	"what_user_said" text,
	"natural_expression" text,
	"what_morrow_remembers" text,
	"world_change" text,
	"user_edited_content" jsonb,
	"visibility" "journal_visibility" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "journal_memory_links" (
	"journal_entry_id" uuid NOT NULL,
	"memory_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_memory_links_journal_entry_id_memory_id_pk" PRIMARY KEY("journal_entry_id","memory_id")
);
--> statement-breakpoint
CREATE TABLE "language_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"event_instance_id" uuid,
	"source_message_id" uuid,
	"result" "language_feedback_result" NOT NULL,
	"focus_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"success_expression" text,
	"original_expression" text,
	"natural_expression" text,
	"pronunciation_note" text,
	"user_saved_as_memory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "language_feedback_has_content" CHECK (jsonb_array_length("language_feedback"."focus_items") > 0)
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"kind" "memory_kind" NOT NULL,
	"status" "memory_status" DEFAULT 'proposed' NOT NULL,
	"content" text NOT NULL,
	"normalized_key" varchar(255),
	"expression" text,
	"natural_expression" text,
	"semantic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" "memory_confidence" DEFAULT 'medium' NOT NULL,
	"sensitivity" "memory_sensitivity" DEFAULT 'normal' NOT NULL,
	"requires_user_confirmation" boolean DEFAULT true NOT NULL,
	"source_event_instance_id" uuid,
	"source_conversation_id" uuid,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memories_version_positive" CHECK ("memories"."version" > 0),
	CONSTRAINT "memories_confirmed_requires_timestamp" CHECK ("memories"."status" <> 'confirmed' or "memories"."confirmed_at" is not null),
	CONSTRAINT "memories_confirmed_are_user_controlled" CHECK ("memories"."requires_user_confirmation" = true)
);
--> statement-breakpoint
CREATE TABLE "memory_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "memory_revision_action" NOT NULL,
	"actor" "revision_actor" NOT NULL,
	"previous_content" text,
	"new_content" text,
	"previous_status" "memory_status",
	"new_status" "memory_status" NOT NULL,
	"reason_code" varchar(96),
	"merged_into_memory_id" uuid,
	"memory_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_revisions_version_positive" CHECK ("memory_revisions"."memory_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "memory_sources" (
	"memory_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_sources_memory_id_message_id_pk" PRIMARY KEY("memory_id","message_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content_text" text NOT NULL,
	"input_mode" "message_input_mode" NOT NULL,
	"asr_confidence" double precision,
	"event_state_id" varchar(96),
	"client_message_id" varchar(160) NOT NULL,
	"model_output_json" jsonb,
	"status" "message_status" DEFAULT 'accepted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "messages_asr_confidence_range" CHECK ("messages"."asr_confidence" is null or ("messages"."asr_confidence" >= 0 and "messages"."asr_confidence" <= 1))
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"character_key" varchar(64) DEFAULT 'morrow' NOT NULL,
	"display_name" varchar(64) DEFAULT 'Morrow' NOT NULL,
	"persona_version" varchar(64) DEFAULT 'morrow-1.0' NOT NULL,
	"relationship_stage" "relationship_stage" DEFAULT 'NEW' NOT NULL,
	"meaningful_interaction_count" integer DEFAULT 0 NOT NULL,
	"communication_success_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_meaningful_count_nonnegative" CHECK ("pets"."meaningful_interaction_count" >= 0),
	CONSTRAINT "pets_communication_count_nonnegative" CHECK ("pets"."communication_success_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "privacy_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"document_version" varchar(64) NOT NULL,
	"decision" "consent_decision" NOT NULL,
	"source" "consent_source" NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resurfacing_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"event_instance_id" uuid NOT NULL,
	"mode" "resurfacing_mode" NOT NULL,
	"result" "resurfacing_result" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resurfacing_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"memory_id" uuid NOT NULL,
	"target_event_key" varchar(96) NOT NULL,
	"semantic_contexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "resurfacing_status" DEFAULT 'pending' NOT NULL,
	"min_event_gap" integer DEFAULT 1 NOT NULL,
	"cooldown_until" timestamp with time zone,
	"next_eligible_at" timestamp with time zone,
	"last_served_at" timestamp with time zone,
	"serve_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resurfacing_min_gap_positive" CHECK ("resurfacing_tasks"."min_event_gap" >= 1),
	CONSTRAINT "resurfacing_serve_count_nonnegative" CHECK ("resurfacing_tasks"."serve_count" >= 0),
	CONSTRAINT "resurfacing_success_count_nonnegative" CHECK ("resurfacing_tasks"."success_count" >= 0),
	CONSTRAINT "resurfacing_success_not_over_served" CHECK ("resurfacing_tasks"."success_count" <= "resurfacing_tasks"."serve_count")
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "identity_provider" NOT NULL,
	"provider_subject" varchar(255) NOT NULL,
	"email_normalized" varchar(320),
	"phone_e164" varchar(32),
	"verified_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"language_level" "language_level" DEFAULT 'L2' NOT NULL,
	"preferred_reply_length" "reply_length" DEFAULT 'standard' NOT NULL,
	"speech_rate" "speech_rate" DEFAULT 'normal' NOT NULL,
	"subtitles_enabled" boolean DEFAULT true NOT NULL,
	"correction_preference" "correction_preference" DEFAULT 'after_conversation' NOT NULL,
	"memory_enabled" boolean DEFAULT true NOT NULL,
	"voice_input_enabled" boolean DEFAULT true NOT NULL,
	"voice_output_enabled" boolean DEFAULT true NOT NULL,
	"interface_locale" varchar(16) DEFAULT 'zh-CN' NOT NULL,
	"time_zone" varchar(64) DEFAULT 'Asia/Shanghai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_world_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pet_id" uuid NOT NULL,
	"state_key" varchar(96) NOT NULL,
	"state_value" jsonb NOT NULL,
	"source_event_instance_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_world_state_version_positive" CHECK ("user_world_state"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_kind" "account_kind" DEFAULT 'guest' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"locale" varchar(16) DEFAULT 'zh-CN' NOT NULL,
	"time_zone" varchar(64) DEFAULT 'Asia/Shanghai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"purge_after" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_instances" ADD CONSTRAINT "event_instances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_instances" ADD CONSTRAINT "event_instances_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_instances" ADD CONSTRAINT "event_instances_event_definition_id_event_definitions_id_fk" FOREIGN KEY ("event_definition_id") REFERENCES "public"."event_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outcomes" ADD CONSTRAINT "event_outcomes_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_outcomes" ADD CONSTRAINT "event_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_transition_logs" ADD CONSTRAINT "event_transition_logs_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_transition_logs" ADD CONSTRAINT "event_transition_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_transition_logs" ADD CONSTRAINT "event_transition_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_memory_links" ADD CONSTRAINT "journal_memory_links_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_memory_links" ADD CONSTRAINT "journal_memory_links_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "language_feedback" ADD CONSTRAINT "language_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "language_feedback" ADD CONSTRAINT "language_feedback_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "language_feedback" ADD CONSTRAINT "language_feedback_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "language_feedback" ADD CONSTRAINT "language_feedback_source_message_id_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_event_instance_id_event_instances_id_fk" FOREIGN KEY ("source_event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_source_conversation_id_conversations_id_fk" FOREIGN KEY ("source_conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_revisions" ADD CONSTRAINT "memory_revisions_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_revisions" ADD CONSTRAINT "memory_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_revisions" ADD CONSTRAINT "memory_revisions_merged_into_memory_id_memories_id_fk" FOREIGN KEY ("merged_into_memory_id") REFERENCES "public"."memories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_sources" ADD CONSTRAINT "memory_sources_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_sources" ADD CONSTRAINT "memory_sources_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_consents" ADD CONSTRAINT "privacy_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resurfacing_attempts" ADD CONSTRAINT "resurfacing_attempts_task_id_resurfacing_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."resurfacing_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resurfacing_attempts" ADD CONSTRAINT "resurfacing_attempts_event_instance_id_event_instances_id_fk" FOREIGN KEY ("event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resurfacing_tasks" ADD CONSTRAINT "resurfacing_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resurfacing_tasks" ADD CONSTRAINT "resurfacing_tasks_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_world_state" ADD CONSTRAINT "user_world_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_world_state" ADD CONSTRAINT "user_world_state_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_world_state" ADD CONSTRAINT "user_world_state_source_event_instance_id_event_instances_id_fk" FOREIGN KEY ("source_event_instance_id") REFERENCES "public"."event_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_user_status_idx" ON "account_deletion_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "conversations_user_recent_idx" ON "conversations" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_event_idx" ON "conversations" USING btree ("event_instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_definitions_key_version_uq" ON "event_definitions" USING btree ("event_key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "event_definitions_config_hash_uq" ON "event_definitions" USING btree ("config_hash");--> statement-breakpoint
CREATE INDEX "event_definitions_active_idx" ON "event_definitions" USING btree ("event_key","status");--> statement-breakpoint
CREATE INDEX "event_instances_user_status_idx" ON "event_instances" USING btree ("user_id","status","available_at");--> statement-breakpoint
CREATE INDEX "event_instances_definition_idx" ON "event_instances" USING btree ("event_definition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_instances_one_open_per_user_uq" ON "event_instances" USING btree ("user_id") WHERE "event_instances"."status" in ('active', 'paused');--> statement-breakpoint
CREATE UNIQUE INDEX "event_outcomes_instance_uq" ON "event_outcomes" USING btree ("event_instance_id");--> statement-breakpoint
CREATE INDEX "event_outcomes_user_idx" ON "event_outcomes" USING btree ("user_id","committed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_transition_user_idempotency_uq" ON "event_transition_logs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "event_transition_instance_time_idx" ON "event_transition_logs" USING btree ("event_instance_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_sessions_token_hash_uq" ON "guest_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "guest_sessions_user_active_idx" ON "guest_sessions" USING btree ("user_id","revoked_at","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_user_scope_key_uq" ON "idempotency_records" USING btree ("user_id","scope","idempotency_key");--> statement-breakpoint
CREATE INDEX "idempotency_expiry_idx" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entries_event_uq" ON "journal_entries" USING btree ("event_instance_id");--> statement-breakpoint
CREATE INDEX "journal_entries_user_time_idx" ON "journal_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "language_feedback_event_uq" ON "language_feedback" USING btree ("event_instance_id") WHERE "language_feedback"."event_instance_id" is not null;--> statement-breakpoint
CREATE INDEX "language_feedback_user_time_idx" ON "language_feedback" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "memories_active_lookup_idx" ON "memories" USING btree ("user_id","kind","status","deleted_at","expires_at");--> statement-breakpoint
CREATE INDEX "memories_source_event_idx" ON "memories" USING btree ("source_event_instance_id");--> statement-breakpoint
CREATE INDEX "memory_revisions_memory_version_idx" ON "memory_revisions" USING btree ("memory_id","memory_version");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_client_uq" ON "messages" USING btree ("conversation_id","client_message_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_time_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_user_deleted_idx" ON "messages" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pets_user_uq" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "privacy_consents_latest_idx" ON "privacy_consents" USING btree ("user_id","consent_type","decided_at");--> statement-breakpoint
CREATE UNIQUE INDEX "resurfacing_attempt_task_event_uq" ON "resurfacing_attempts" USING btree ("task_id","event_instance_id");--> statement-breakpoint
CREATE INDEX "resurfacing_eligibility_idx" ON "resurfacing_tasks" USING btree ("user_id","target_event_key","status","next_eligible_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identities_provider_subject_uq" ON "user_identities" USING btree ("provider","provider_subject");--> statement-breakpoint
CREATE INDEX "user_identities_user_idx" ON "user_identities" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_world_state_key_uq" ON "user_world_state" USING btree ("user_id","pet_id","state_key");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status","deleted_at");