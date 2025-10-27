export type Difficulty = "easy" | "medium" | "hard" | "expert" | "impossible";

export interface DifficultySettings {
  pipeSpeed: number;
  pipeGap: number;
  pipeSpacing: number;
  gravity: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    pipeSpeed: 1.5,
    pipeGap: 180,
    pipeSpacing: 300,
    gravity: 0.4,
  },
  medium: {
    pipeSpeed: 2,
    pipeGap: 150,
    pipeSpacing: 250,
    gravity: 0.5,
  },
  hard: {
    pipeSpeed: 2.5,
    pipeGap: 130,
    pipeSpacing: 220,
    gravity: 0.6,
  },
  expert: {
    pipeSpeed: 3,
    pipeGap: 110,
    pipeSpacing: 200,
    gravity: 0.7,
  },
  impossible: {
    pipeSpeed: 4,
    pipeGap: 90,
    pipeSpacing: 180,
    gravity: 0.8,
  },
};

export type BirdSkin = "yellow" | "blue" | "red" | "green" | "pink";

export interface BirdSkinColors {
  body: string;
  accent: string;
}

export const BIRD_SKINS: Record<BirdSkin, BirdSkinColors> = {
  yellow: {
    body: "#FFD93D",
    accent: "#FF8C42",
  },
  blue: {
    body: "#4A90E2",
    accent: "#2E5C8A",
  },
  red: {
    body: "#E74C3C",
    accent: "#C0392B",
  },
  green: {
    body: "#2ECC71",
    accent: "#27AE60",
  },
  pink: {
    body: "#FF6B9D",
    accent: "#C44569",
  },
};
