
-- Global chat messages table
CREATE TABLE public.global_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS with public access (no auth)
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on global_messages" ON public.global_messages FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;

-- Auto-cleanup old messages (keep last 200)
CREATE OR REPLACE FUNCTION public.cleanup_old_global_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.global_messages
  WHERE id NOT IN (
    SELECT id FROM public.global_messages
    ORDER BY created_at DESC
    LIMIT 200
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER cleanup_global_messages_trigger
AFTER INSERT ON public.global_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_global_messages();
