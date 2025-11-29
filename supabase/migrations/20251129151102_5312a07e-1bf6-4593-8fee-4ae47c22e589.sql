-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to create default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Update filaments RLS policies to check admin role
DROP POLICY IF EXISTS "Authenticated users can delete filaments" ON public.filaments;
DROP POLICY IF EXISTS "Authenticated users can insert filaments" ON public.filaments;
DROP POLICY IF EXISTS "Authenticated users can update filaments" ON public.filaments;

CREATE POLICY "Admins can manage filaments"
ON public.filaments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update deals RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can insert deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can update deals" ON public.deals;

CREATE POLICY "Admins can manage deals"
ON public.deals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update printers RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete printers" ON public.printers;
DROP POLICY IF EXISTS "Authenticated users can insert printers" ON public.printers;
DROP POLICY IF EXISTS "Authenticated users can update printers" ON public.printers;

CREATE POLICY "Admins can manage printers"
ON public.printers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update printer_compatibility RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete printer_compatibility" ON public.printer_compatibility;
DROP POLICY IF EXISTS "Authenticated users can insert printer_compatibility" ON public.printer_compatibility;
DROP POLICY IF EXISTS "Authenticated users can update printer_compatibility" ON public.printer_compatibility;

CREATE POLICY "Admins can manage printer_compatibility"
ON public.printer_compatibility
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));