-- Enable realtime for filaments and printers tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.filaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.printers;