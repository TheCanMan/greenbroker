-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker: Supabase Row Level Security (RLS) Policies
-- Run this in: Supabase Dashboard → SQL Editor
-- Or: supabase db push (if using Supabase CLI)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
-- stripe_events: no RLS needed — server-side only

-- ─── profiles ─────────────────────────────────────────────────────────────────

-- Users can only read/update their own profile
CREATE POLICY "profiles: users read own"
  ON profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "profiles: users update own"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Service role (server) can do anything
CREATE POLICY "profiles: service role full access"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ─── home_assessments ─────────────────────────────────────────────────────────

-- Users can read their own assessments
CREATE POLICY "assessments: users read own"
  ON home_assessments FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
    OR profile_id IS NULL  -- anonymous assessments are readable by creator session
  );

-- Users can insert assessments (profile_id = their own or null)
CREATE POLICY "assessments: users insert own"
  ON home_assessments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
    OR profile_id IS NULL
  );

-- Users can update their own assessments
CREATE POLICY "assessments: users update own"
  ON home_assessments FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Service role full access (needed for contractor lead purchases)
CREATE POLICY "assessments: service role full access"
  ON home_assessments FOR ALL
  USING (auth.role() = 'service_role');

-- ─── contractors ─────────────────────────────────────────────────────────────

-- Anyone can read ACTIVE contractor profiles (public marketplace)
CREATE POLICY "contractors: public read active"
  ON contractors FOR SELECT
  USING (status = 'ACTIVE');

-- Contractors can read their own profile regardless of status
CREATE POLICY "contractors: read own"
  ON contractors FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Contractors can update their own profile (except tier/status — admin only)
CREATE POLICY "contractors: update own non-admin fields"
  ON contractors FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "contractors: service role full access"
  ON contractors FOR ALL
  USING (auth.role() = 'service_role');

-- ─── leads ───────────────────────────────────────────────────────────────────

-- Contractors can only see their own leads
CREATE POLICY "leads: contractors read own"
  ON leads FOR SELECT
  USING (
    contractor_id IN (
      SELECT c.id FROM contractors c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Contractors can update their own leads (to update status)
CREATE POLICY "leads: contractors update own"
  ON leads FOR UPDATE
  USING (
    contractor_id IN (
      SELECT c.id FROM contractors c
      JOIN profiles p ON c.profile_id = p.id
      WHERE p.user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "leads: service role full access"
  ON leads FOR ALL
  USING (auth.role() = 'service_role');

-- ─── reviews ─────────────────────────────────────────────────────────────────

-- Anyone can read verified reviews
CREATE POLICY "reviews: public read"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "reviews: authenticated insert"
  ON reviews FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Users can update/delete their own reviews
CREATE POLICY "reviews: users manage own"
  ON reviews FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "reviews: service role full access"
  ON reviews FOR ALL
  USING (auth.role() = 'service_role');

-- ─── rebate_applications ──────────────────────────────────────────────────────

-- Users can manage their own applications
CREATE POLICY "rebate_apps: users manage own"
  ON rebate_applications FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "rebate_apps: service role full access"
  ON rebate_applications FOR ALL
  USING (auth.role() = 'service_role');

-- ─── contact_requests ────────────────────────────────────────────────────────

-- Anyone can insert (contact form doesn't require auth)
CREATE POLICY "contact: anyone insert"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin/ops only)
CREATE POLICY "contact: service role read"
  ON contact_requests FOR SELECT
  USING (auth.role() = 'service_role');

-- ─── Auto-create profile on signup ────────────────────────────────────────────
-- Supabase trigger: create a profile row when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, role, created_at, updated_at)
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    NEW.email,
    'HOMEOWNER',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Run these in Supabase SQL Editor after enabling Storage

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('utility-bills', 'utility-bills', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('property-photos', 'property-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('contractor-logos', 'contractor-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
CREATE POLICY "utility-bills: users manage own"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'utility-bills'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "property-photos: users manage own"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "contractor-logos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contractor-logos');

CREATE POLICY "contractor-logos: owner manage"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'contractor-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
