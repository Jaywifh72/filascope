-- Create trigger to auto-assign 'user' role when new user signs up
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

-- Attach trigger to auth.users (fires after user creation)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Update RLS policies for admin full access
DROP POLICY IF EXISTS "Admins can insert filaments" ON public.filaments;
CREATE POLICY "Admins can insert filaments"
  ON public.filaments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update filaments" ON public.filaments;
CREATE POLICY "Admins can update filaments"
  ON public.filaments
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete filaments" ON public.filaments;
CREATE POLICY "Admins can delete filaments"
  ON public.filaments
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update deals policies
DROP POLICY IF EXISTS "Admins can insert deals" ON public.deals;
CREATE POLICY "Admins can insert deals"
  ON public.deals
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update deals" ON public.deals;
CREATE POLICY "Admins can update deals"
  ON public.deals
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete deals" ON public.deals;
CREATE POLICY "Admins can delete deals"
  ON public.deals
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update printers policies
DROP POLICY IF EXISTS "Admins can insert printers" ON public.printers;
CREATE POLICY "Admins can insert printers"
  ON public.printers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update printers" ON public.printers;
CREATE POLICY "Admins can update printers"
  ON public.printers
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete printers" ON public.printers;
CREATE POLICY "Admins can delete printers"
  ON public.printers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update printer_compatibility policies
DROP POLICY IF EXISTS "Admins can insert compatibility" ON public.printer_compatibility;
CREATE POLICY "Admins can insert compatibility"
  ON public.printer_compatibility
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update compatibility" ON public.printer_compatibility;
CREATE POLICY "Admins can update compatibility"
  ON public.printer_compatibility
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete compatibility" ON public.printer_compatibility;
CREATE POLICY "Admins can delete compatibility"
  ON public.printer_compatibility
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));