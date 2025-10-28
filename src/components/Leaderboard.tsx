import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Difficulty } from "@/types/game";

interface LeaderboardEntry {
  id: string;
  score: number;
  difficulty: string;
  bird_skin: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard = ({ onBack }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [difficulty]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*, profiles(username)")
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .limit(10);

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert", "impossible"];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
      <div className="bg-white/90 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <h2 className="pixel-text text-4xl mb-6 text-center text-primary">Leaderboard</h2>
        
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {difficulties.map((diff) => (
            <Button
              key={diff}
              onClick={() => setDifficulty(diff)}
              variant={difficulty === diff ? "default" : "outline"}
              size="sm"
              className="pixel-text text-xs"
            >
              {diff}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-center pixel-text">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center pixel-text text-gray-600">No scores yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-white rounded border-2 border-black"
              >
                <div className="flex items-center gap-4">
                  <span className="pixel-text text-2xl font-bold w-8">#{index + 1}</span>
                  <span className="pixel-text">{entry.profiles.username}</span>
                </div>
                <span className="pixel-text text-xl font-bold">{entry.score}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onBack} className="w-full mt-6 pixel-text">
          Back to Menu
        </Button>
      </div>
    </div>
  );
};
