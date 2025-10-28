import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DailyChallengeProps {
  onBack: () => void;
  onStartChallenge: (challengeId: string, seed: string, difficulty: string) => void;
  userId: string;
}

interface Challenge {
  id: string;
  challenge_date: string;
  difficulty: string;
  target_score: number;
  seed: string;
}

interface Score {
  score: number;
}

export const DailyChallenge = ({ onBack, onStartChallenge, userId }: DailyChallengeProps) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userScore, setUserScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  const fetchDailyChallenge = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    let { data: existingChallenge } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("challenge_date", today)
      .single();

    if (!existingChallenge) {
      const seed = Math.random().toString(36).substring(7);
      const { data: newChallenge } = await supabase
        .from("daily_challenges")
        .insert({
          challenge_date: today,
          difficulty: "medium",
          target_score: 15,
          seed,
        })
        .select()
        .single();
      existingChallenge = newChallenge;
    }

    if (existingChallenge) {
      setChallenge(existingChallenge);
      
      const { data: score } = await supabase
        .from("challenge_scores")
        .select("score")
        .eq("challenge_id", existingChallenge.id)
        .eq("user_id", userId)
        .single();
      
      setUserScore(score);
    }
    setLoading(false);
  };

  const handleStart = () => {
    if (challenge) {
      onStartChallenge(challenge.id, challenge.seed, challenge.difficulty);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
        <p className="pixel-text text-white text-2xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
      <div className="bg-white/90 p-8 rounded-lg max-w-md w-full mx-4">
        <h2 className="pixel-text text-4xl mb-6 text-center text-primary">Daily Challenge</h2>
        
        {challenge && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-4 rounded border-2 border-blue-300">
              <p className="pixel-text text-sm text-gray-600 mb-2">Today's Challenge</p>
              <p className="pixel-text text-xl">Difficulty: <span className="font-bold">{challenge.difficulty}</span></p>
              <p className="pixel-text text-xl">Target: <span className="font-bold">{challenge.target_score}</span> points</p>
            </div>

            {userScore ? (
              <div className="bg-green-50 p-4 rounded border-2 border-green-300">
                <p className="pixel-text text-center text-xl">
                  Your Score: <span className="font-bold text-2xl">{userScore.score}</span>
                </p>
                {userScore.score >= challenge.target_score && (
                  <p className="pixel-text text-center text-green-600 mt-2">✓ Challenge Completed!</p>
                )}
              </div>
            ) : (
              <p className="pixel-text text-center text-gray-600">You haven't attempted today's challenge yet!</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={handleStart} className="w-full pixel-text">
            {userScore ? "Try Again" : "Start Challenge"}
          </Button>
          <Button onClick={onBack} variant="outline" className="w-full pixel-text">
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
