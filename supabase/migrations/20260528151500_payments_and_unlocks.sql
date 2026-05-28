-- Create public.payments
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY, -- Razorpay Payment ID or transaction reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  amount INT NOT NULL, -- in rupees or paise
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'pending', 'captured', 'failed'
  email TEXT,
  notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "p_select_own" ON public.payments 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "p_insert_own" ON public.payments 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create public.premium_unlocks
CREATE TABLE IF NOT EXISTS public.premium_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_signature TEXT NOT NULL,
  payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on premium_unlocks
ALTER TABLE public.premium_unlocks ENABLE ROW LEVEL SECURITY;

-- Unlocks policies
CREATE POLICY "u_select_own" ON public.premium_unlocks 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "u_insert_own" ON public.premium_unlocks 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "u_update_own" ON public.premium_unlocks 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS premium_unlocks_resume_sig_idx ON public.premium_unlocks(resume_id, version_signature);

-- Create public.resume_versions
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_signature TEXT NOT NULL,
  content JSONB NOT NULL,
  template TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on resume_versions
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- Versions policies
CREATE POLICY "v_select_own" ON public.resume_versions 
  FOR SELECT TO authenticated USING (
    auth.uid() = (SELECT user_id FROM public.resumes WHERE id = resume_id)
  );
CREATE POLICY "v_insert_own" ON public.resume_versions 
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.resumes WHERE id = resume_id)
  );

CREATE INDEX IF NOT EXISTS resume_versions_sig_idx ON public.resume_versions(resume_id, version_signature);
