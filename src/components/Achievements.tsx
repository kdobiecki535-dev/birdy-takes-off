import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface AchievementsProps {
  onBack: () => void;
  userId: string;
}

export const Achievements = ({ onBack, userId }: AchievementsProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*");

    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    if (allAchievements) {
      const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
      const achievementsWithStatus = allAchievements.map((ach) => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id),
      }));
      setAchievements(achievementsWithStatus);
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
      <div className="bg-white/90 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <h2 className="pixel-text text-4xl mb-6 text-center text-primary">Achievements</h2>

        {loading ? (
          <p className="text-center pixel-text">Loading...</p>
        ) : (
          <div className="grid gap-4 mb-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded border-2 ${
                  achievement.unlocked
                    ? "bg-yellow-50 border-yellow-400"
                    : "bg-gray-50 border-gray-300 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className="pixel-text text-xl font-bold">
                      {achievement.name}
                      {achievement.unlocked && " ✓"}
                    </h3>
                    <p className="pixel-text text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onBack} className="w-full pixel-text">
          Back to Menu
        </Button>
      </div>
    </div>
  );
};
