CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.review_status AS ENUM ('baru', 'ditangani', 'selesai');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- First registered account becomes the initial admin; later signups get no role.
CREATE OR REPLACE FUNCTION public.assign_initial_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_initial_admin();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  categories text[] NOT NULL DEFAULT '{}',
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 5 AND 2000),
  suggestion text CHECK (suggestion IS NULL OR char_length(suggestion) <= 2000),
  is_anonymous boolean NOT NULL DEFAULT true,
  customer_name text CHECK (customer_name IS NULL OR char_length(customer_name) <= 80),
  staff_feedback text CHECK (staff_feedback IS NULL OR char_length(staff_feedback) <= 2000),
  is_public boolean NOT NULL DEFAULT false,
  status public.review_status NOT NULL DEFAULT 'baru',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reviews TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  is_public = false AND status = 'baru'
  AND categories <@ ARRAY['makanan','minuman','suasana','kebersihan','pelayanan']::text[]
  AND (is_anonymous = false OR customer_name IS NULL)
);
CREATE POLICY "Admins read reviews" ON public.reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe read: only approved positive reviews, no staff feedback, names only when not anonymous.
CREATE OR REPLACE FUNCTION public.get_public_reviews()
RETURNS TABLE (id uuid, rating smallint, categories text[], comment text, display_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating, r.categories, r.comment,
    CASE WHEN r.is_anonymous OR r.customer_name IS NULL OR r.customer_name = '' THEN 'Pelanggan Sepetak'
         ELSE split_part(r.customer_name, ' ', 1) END,
    r.created_at
  FROM public.reviews r
  WHERE r.is_public = true AND r.rating >= 4
  ORDER BY r.created_at DESC
  LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.get_public_reviews() TO anon, authenticated;