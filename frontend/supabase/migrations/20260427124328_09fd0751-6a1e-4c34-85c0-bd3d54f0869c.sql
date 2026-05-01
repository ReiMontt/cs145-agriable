-- Create quotas table with history
CREATE TABLE public.quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  national_id TEXT NOT NULL,
  quota_kg NUMERIC NOT NULL CHECK (quota_kg >= 0),
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotas_national_id ON public.quotas(national_id);
CREATE INDEX idx_quotas_effective_from ON public.quotas(effective_from DESC);
CREATE INDEX idx_transactions_target_id ON public.transactions(target_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;

-- DEMO MODE policies: public read + write for all three tables.
-- TODO: Tighten these once admin authentication is implemented.
CREATE POLICY "Demo: public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Demo: public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo: public update users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Demo: public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Demo: public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo: public update transactions" ON public.transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Demo: public read quotas" ON public.quotas FOR SELECT USING (true);
CREATE POLICY "Demo: public insert quotas" ON public.quotas FOR INSERT WITH CHECK (true);
CREATE POLICY "Demo: public update quotas" ON public.quotas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Demo: public delete quotas" ON public.quotas FOR DELETE USING (true);