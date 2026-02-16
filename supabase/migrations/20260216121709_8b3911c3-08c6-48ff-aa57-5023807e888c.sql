
-- Battle rooms table
CREATE TABLE public.battle_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  settings JSONB,
  seed INTEGER,
  game JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Battle players table
CREATE TABLE public.battle_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT false,
  connected BOOLEAN NOT NULL DEFAULT true,
  score INTEGER NOT NULL DEFAULT 0,
  speed_bonus INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}',
  UNIQUE(room_id, player_id)
);

-- Battle messages table
CREATE TABLE public.battle_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS with permissive policies (no auth for game lobbies)
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on battle_rooms" ON public.battle_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on battle_players" ON public.battle_players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on battle_messages" ON public.battle_messages FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all battle tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_messages;
