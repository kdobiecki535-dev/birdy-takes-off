import { Button } from "@/components/ui/button";
import { DifficultySelector } from "./DifficultySelector";
import { BirdSkinSelector } from "./BirdSkinSelector";
import { Difficulty, BirdSkin } from "@/types/game";

interface MainMenuProps {
  onStartGame: () => void;
  onNavigate: (page: "leaderboard" | "daily" | "multiplayer" | "achievements") => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  birdSkin: BirdSkin;
  setBirdSkin: (s: BirdSkin) => void;
  username: string;
  onSignOut: () => void;
}

export const MainMenu = ({
  onStartGame,
  onNavigate,
  difficulty,
  setDifficulty,
  birdSkin,
  setBirdSkin,
  username,
  onSignOut,
}: MainMenuProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
      <div className="text-center bg-white/90 p-8 rounded-lg max-w-md w-full mx-4">
        <h1 className="pixel-text text-6xl mb-2 text-primary">Flappy Bird</h1>
        <p className="pixel-text text-sm mb-6 text-gray-600">Welcome, {username}!</p>
        
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
        <BirdSkinSelector selected={birdSkin} onSelect={setBirdSkin} />
        
        <div className="space-y-2 mt-6">
          <Button onClick={onStartGame} className="w-full pixel-text">
            Play Solo
          </Button>
          <Button onClick={() => onNavigate("daily")} variant="secondary" className="w-full pixel-text">
            Daily Challenge
          </Button>
          <Button onClick={() => onNavigate("multiplayer")} variant="secondary" className="w-full pixel-text">
            Multiplayer
          </Button>
          <Button onClick={() => onNavigate("leaderboard")} variant="outline" className="w-full pixel-text">
            Leaderboard
          </Button>
          <Button onClick={() => onNavigate("achievements")} variant="outline" className="w-full pixel-text">
            Achievements
          </Button>
          <Button onClick={onSignOut} variant="ghost" className="w-full pixel-text text-sm">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
