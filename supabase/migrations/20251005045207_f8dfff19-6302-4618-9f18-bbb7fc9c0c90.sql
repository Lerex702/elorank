-- Create players table for Minecraft Elo rankings
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 1000,
  kills INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  kd_ratio DECIMAL(10,2) NOT NULL DEFAULT 0,
  highest_elo INTEGER NOT NULL DEFAULT 1000,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster leaderboard queries
CREATE INDEX idx_players_elo ON public.players(elo DESC);
CREATE INDEX idx_players_uuid ON public.players(uuid);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (leaderboard is public)
CREATE POLICY "Public read access for players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;