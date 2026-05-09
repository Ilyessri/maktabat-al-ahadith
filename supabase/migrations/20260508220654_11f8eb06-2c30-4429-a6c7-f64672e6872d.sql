CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated insert hadiths" ON public.hadiths;
DROP POLICY IF EXISTS "Authenticated update hadiths" ON public.hadiths;
CREATE POLICY "Admins insert hadiths" ON public.hadiths FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update hadiths" ON public.hadiths FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Authenticated insert synonyms" ON public.synonyms;
CREATE POLICY "Admins insert synonyms" ON public.synonyms FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
