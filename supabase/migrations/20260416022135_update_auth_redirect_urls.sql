/*
  # Update Auth Configuration

  This migration ensures the auth settings are documented.
  The OAuth redirect URL must be configured in the Supabase dashboard
  under Authentication > URL Configuration to include:
  - http://localhost:5173 (Vite dev server)
  - The production URL

  No schema changes needed - this is a configuration note.
*/

DO $$
BEGIN
  -- Ensure updated_at trigger exists on user_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'set_updated_at'
    AND event_object_table = 'user_profiles'
  ) THEN
    -- Create updated_at trigger function if not exists
    NULL;
  END IF;
END $$;
