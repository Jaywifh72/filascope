-- User printers table for multi-printer management
CREATE TABLE public.user_printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  printer_id TEXT NOT NULL,
  nickname TEXT,
  is_primary BOOLEAN DEFAULT false,
  hardware_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_printers_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.user_printers ENABLE ROW LEVEL SECURITY;

-- Users can view their own printers
CREATE POLICY "Users can view own printers" 
ON public.user_printers 
FOR SELECT 
USING ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can insert their own printers
CREATE POLICY "Users can insert own printers" 
ON public.user_printers 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can update their own printers
CREATE POLICY "Users can update own printers" 
ON public.user_printers 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can delete their own printers
CREATE POLICY "Users can delete own printers" 
ON public.user_printers 
FOR DELETE 
USING ((auth.uid() = user_id) OR (user_id IS NULL AND session_id IS NOT NULL));

-- Trigger for updated_at
CREATE TRIGGER update_user_printers_updated_at
BEFORE UPDATE ON public.user_printers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_user_printers_user_id ON public.user_printers(user_id);
CREATE INDEX idx_user_printers_session_id ON public.user_printers(session_id);
CREATE INDEX idx_user_printers_printer_id ON public.user_printers(printer_id);