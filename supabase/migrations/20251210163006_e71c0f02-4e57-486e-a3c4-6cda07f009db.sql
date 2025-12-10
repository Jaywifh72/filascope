-- Fix price_history INSERT policy - restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can insert price_history" ON public.price_history;
CREATE POLICY "Admins can insert price_history" 
ON public.price_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix accessory_price_history INSERT policy - restrict to admin only  
DROP POLICY IF EXISTS "Service can insert price history" ON public.accessory_price_history;
CREATE POLICY "Admins can insert accessory price history"
ON public.accessory_price_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix printer_price_history INSERT policy - restrict to admin only
DROP POLICY IF EXISTS "Service can insert price history" ON public.printer_price_history;
CREATE POLICY "Admins can insert printer price history"
ON public.printer_price_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));