-- Add INSERT, UPDATE, DELETE policies for authenticated users on filaments table
-- This allows admin users to manage filament data

CREATE POLICY "Authenticated users can insert filaments"
  ON public.filaments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update filaments"
  ON public.filaments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete filaments"
  ON public.filaments FOR DELETE
  TO authenticated
  USING (true);

-- Add similar policies for related tables

CREATE POLICY "Authenticated users can insert printers"
  ON public.printers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update printers"
  ON public.printers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete printers"
  ON public.printers FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deals"
  ON public.deals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deals"
  ON public.deals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete deals"
  ON public.deals FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert price_history"
  ON public.price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert printer_compatibility"
  ON public.printer_compatibility FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update printer_compatibility"
  ON public.printer_compatibility FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete printer_compatibility"
  ON public.printer_compatibility FOR DELETE
  TO authenticated
  USING (true);