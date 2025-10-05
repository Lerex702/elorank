import { useEffect, useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsCard } from "@/components/StatsCard";
import { Users, Trophy, Swords, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface Player {
  rank: number;
  uuid: string;
  username: string;
  elo: number;
  kills: number;
  deaths: number;
  kd_ratio: number;
  current_streak: number;
  highest_elo: number;
}

const Index = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();

    // Set up realtime subscription
    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('elo', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rankedPlayers = data?.map((player, index) => ({
        ...player,
        rank: index + 1,
      })) || [];

      setPlayers(rankedPlayers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPlayers = players.length;
  const avgElo = players.length > 0 
    ? Math.round(players.reduce((sum, p) => sum + p.elo, 0) / players.length)
    : 0;
  const topPlayer = players[0];
  const totalKills = players.reduce((sum, p) => sum + p.kills, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-pulse" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <Swords className="w-12 h-12 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Anarchy Elo Rankings
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete, dominate, and climb the ranks in our competitive PvP leaderboard
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Players"
            value={totalPlayers}
            icon={Users}
            description="Registered fighters"
            gradient="from-purple-500/20 to-purple-600/20"
          />
          <StatsCard
            title="Average Elo"
            value={avgElo}
            icon={TrendingUp}
            description="Server average"
            gradient="from-cyan-500/20 to-blue-500/20"
          />
          <StatsCard
            title="Top Player"
            value={topPlayer?.username || "N/A"}
            icon={Trophy}
            description={topPlayer ? `${topPlayer.elo} Elo` : "No data"}
            gradient="from-yellow-500/20 to-orange-500/20"
          />
          <StatsCard
            title="Total Kills"
            value={totalKills.toLocaleString()}
            icon={Swords}
            description="All-time eliminations"
            gradient="from-red-500/20 to-pink-500/20"
          />
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Leaderboard</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : players.length > 0 ? (
            <Leaderboard players={players} />
          ) : (
            <Card className="p-12 text-center border-border/50 bg-card/50 backdrop-blur-sm">
              <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Players Yet</h3>
              <p className="text-muted-foreground">
                Be the first to join the arena and claim your spot!
              </p>
            </Card>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-muted-foreground text-sm py-8">
          <p>Powered by Sceplix's Elo ranking system • Updates in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
