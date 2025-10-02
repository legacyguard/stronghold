-- Reconcile schema conflicts (user_profiles, will_documents) and duplicate triggers
-- Safe-forward migration: adds missing types/columns, fixes trigger name collisions, and idempotent indexes

-- Ensure custom ENUM types exist
DO $$ BEGIN
  CREATE TYPE jurisdiction_enum AS ENUM ('SK', 'CZ', 'AT', 'DE', 'PL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE will_type_enum AS ENUM ('holographic', 'witnessed', 'notarized', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trust_level_enum AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_tier_enum AS ENUM ('free', 'paid', 'family_edition');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collaboration_role_enum AS ENUM ('guardian', 'executor', 'heir', 'emergency_contact', 'observer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_profiles: align with canonical auth.users linkage and add tier when missing
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS tier user_tier_enum DEFAULT 'free';

-- Add FK from user_profiles.id -> auth.users(id) if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass
      AND conname = 'user_profiles_id_fkey'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Normalize updated_at trigger (avoid duplicate trigger definitions)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DO $$ BEGIN
  CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- will_documents: extend Phase 5 schema with Enhanced Will fields if missing
ALTER TABLE IF EXISTS public.will_documents
  ADD COLUMN IF NOT EXISTS document_type will_type_enum,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_final boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Convert jurisdiction to enum if currently text and values compatible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'will_documents'
      AND column_name = 'jurisdiction'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.will_documents
      ALTER COLUMN jurisdiction TYPE jurisdiction_enum
      USING jurisdiction::jurisdiction_enum;
  END IF;
END$$;

-- Ensure helpful indexes exist (idempotent)
CREATE INDEX IF NOT EXISTS idx_will_documents_created_at ON public.will_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_will_documents_user_id ON public.will_documents(user_id);

-- Fix duplicate trigger name collisions on auth.users
-- Drop any previous conflicting trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate distinct triggers for profile bootstrap and progress bootstrap
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN undefined_function THEN NULL -- handle_missing function in dev
  WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created_user_progress
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_progress();
EXCEPTION WHEN undefined_function THEN NULL
  WHEN duplicate_object THEN NULL; END $$;

-- Optional: ensure updated_at triggers exist for will_documents
DROP TRIGGER IF EXISTS update_will_documents_updated_at ON public.will_documents;
DO $$ BEGIN
  CREATE TRIGGER update_will_documents_updated_at
    BEFORE UPDATE ON public.will_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notes:
-- - This migration is additive and avoids destructive column drops.
-- - If the Enhanced Will migration ran, this aligns Phase 5 with its fields.
-- - If only Phase 5 ran, this prepares the schema for enhanced features.

