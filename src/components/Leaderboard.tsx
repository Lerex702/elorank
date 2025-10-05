import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  rank: number;
  username: string;
  elo: number;
  kills: number;
  deaths: number;
  kd_ratio: number;
  current_streak: number;
}

interface LeaderboardProps {
  players: Player[];
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
  return <span className="text-muted-foreground">#{rank}</span>;
};

const getEloTier = (elo: number): { name: string; color: string } => {
  if (elo >= 2500) return { name: "Legend", color: "bg-gradient-to-r from-purple-500 to-pink-500" };
  if (elo >= 2200) return { name: "Grandmaster", color: "bg-gradient-to-r from-red-500 to-orange-500" };
  if (elo >= 2000) return { name: "Master", color: "bg-gradient-to-r from-purple-600 to-blue-600" };
  if (elo >= 1800) return { name: "Diamond", color: "bg-gradient-to-r from-cyan-500 to-blue-500" };
  if (elo >= 1600) return { name: "Platinum", color: "bg-gradient-to-r from-teal-500 to-cyan-500" };
  if (elo >= 1400) return { name: "Gold", color: "bg-gradient-to-r from-yellow-500 to-yellow-600" };
  if (elo >= 1200) return { name: "Silver", color: "bg-gradient-to-r from-gray-400 to-gray-500" };
  if (elo >= 1000) return { name: "Bronze", color: "bg-gradient-to-r from-amber-700 to-amber-800" };
  return { name: "Unranked", color: "bg-muted" };
};

export const Leaderboard = ({ players }: LeaderboardProps) => {
  return (
    <Card className="w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Tier</TableHead>
              <TableHead className="text-right">Elo</TableHead>
              <TableHead className="text-right">Kills</TableHead>
              <TableHead className="text-right">Deaths</TableHead>
              <TableHead className="text-right">K/D</TableHead>
              <TableHead className="text-center">Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => {
              const tier = getEloTier(player.elo);
              return (
                <TableRow 
                  key={player.rank} 
                  className="border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRankBadge(player.rank)}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {player.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge className={`${tier.color} text-white border-0`}>
                        {tier.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {player.elo}
                  </TableCell>
                  <TableCell className="text-right text-green-400">
                    {player.kills}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    {player.deaths}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {player.kd_ratio.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {player.current_streak > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">
                            {player.current_streak}
                          </span>
                        </>
                      ) : player.current_streak < 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-medium">
                            {Math.abs(player.current_streak)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
