import { Difficulty } from "@/types/game";
import { Button } from "@/components/ui/button";

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "#2ECC71" },
  { value: "medium", label: "Medium", color: "#F39C12" },
  { value: "hard", label: "Hard", color: "#E67E22" },
  { value: "expert", label: "Expert", color: "#E74C3C" },
  { value: "impossible", label: "Impossible", color: "#8E44AD" },
];

export const DifficultySelector = ({ selected, onSelect }: DifficultySelectorProps) => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <p className="pixel-text text-white text-xs mb-2">Difficulty:</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {DIFFICULTIES.map((diff) => (
          <Button
            key={diff.value}
            onClick={() => onSelect(diff.value)}
            className="pixel-text text-xs px-4 py-2 border-2 border-black transition-all"
            style={{
              backgroundColor: selected === diff.value ? diff.color : "white",
              color: selected === diff.value ? "white" : "black",
            }}
          >
            {diff.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
