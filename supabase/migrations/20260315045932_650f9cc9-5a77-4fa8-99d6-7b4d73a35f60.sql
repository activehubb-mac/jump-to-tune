
-- QA Lab: Dummy assets registry
CREATE TABLE public.qa_dummy_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.qa_dummy_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qa_dummy_assets" ON public.qa_dummy_assets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- QA Lab: Test runs
CREATE TABLE public.qa_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  test_user_id TEXT,
  total_steps INT DEFAULT 0,
  passed_steps INT DEFAULT 0,
  failed_steps INT DEFAULT 0,
  error_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.qa_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qa_test_runs" ON public.qa_test_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- QA Lab: Individual test step results
CREATE TABLE public.qa_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.qa_test_runs(id) ON DELETE CASCADE NOT NULL,
  step_name TEXT NOT NULL,
  step_order INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  error_log TEXT,
  screenshot_url TEXT,
  action_location TEXT,
  duration_ms INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.qa_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qa_test_results" ON public.qa_test_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
