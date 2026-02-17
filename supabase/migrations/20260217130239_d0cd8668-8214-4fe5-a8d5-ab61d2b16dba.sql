
-- Study Rooms
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study rooms" ON public.study_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create study rooms" ON public.study_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update study rooms" ON public.study_rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete study rooms" ON public.study_rooms FOR DELETE USING (true);

-- Study Room Members
CREATE TABLE public.study_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT true,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study room members" ON public.study_room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join study rooms" ON public.study_room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update study room members" ON public.study_room_members FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave study rooms" ON public.study_room_members FOR DELETE USING (true);

-- Study Room Messages
CREATE TABLE public.study_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study room messages" ON public.study_room_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send study room messages" ON public.study_room_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for all study room tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
