import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { soundEffects } from "@/utils/soundEffects";
import { 
  Difficulty, 
  BirdSkin, 
  DIFFICULTY_SETTINGS, 
  BIRD_SKINS 
} from "@/types/game";
import { Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MainMenu } from "./MainMenu";
import { Leaderboard } from "./Leaderboard";
import { Achievements } from "./Achievements";
import { DailyChallenge } from "./DailyChallenge";
import { Multiplayer } from "./Multiplayer";

interface Bird {
  x: number;
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  passed: boolean;
}

type GameState = "menu" | "playing" | "gameOver";
type PageState = "menu" | "leaderboard" | "achievements" | "daily" | "multiplayer";
type GameMode = "solo" | "daily" | "multiplayer";

export const Game = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [pageState, setPageState] = useState<PageState>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [birdSkin, setBirdSkin] = useState<BirdSkin>("yellow");
  const [isMuted, setIsMuted] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("solo");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const gameLoopRef = useRef<number>();
  const birdRef = useRef<Bird>({ x: 80, y: 250, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const groundOffsetRef = useRef(0);
  const frameCountRef = useRef(0);

  const settings = DIFFICULTY_SETTINGS[difficulty];
  const birdColors = BIRD_SKINS[birdSkin];

  const FLAP_STRENGTH = -8;
  const PIPE_WIDTH = 60;
  const BIRD_SIZE = 30;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch user's high score
  useEffect(() => {
    if (!user) return;
    
    const fetchHighScore = async () => {
      const { data } = await supabase
        .from("leaderboard")
        .select("score")
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setHighScore(data.score);
      }
    };

    fetchHighScore();
  }, [user]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    soundEffects.setMuted(!isMuted);
  };

  const resetGame = useCallback(() => {
    birdRef.current = { x: 80, y: 250, velocity: 0 };
    pipesRef.current = [];
    groundOffsetRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
  }, []);

  const submitScore = async (finalScore: number) => {
    if (!user || finalScore === 0) return;

    try {
      // Submit to leaderboard
      await supabase.from("leaderboard").insert({
        user_id: user.id,
        score: finalScore,
        difficulty,
        bird_skin: birdSkin,
      });

      // Submit to daily challenge if applicable
      if (gameMode === "daily" && challengeId) {
        await supabase
          .from("challenge_scores")
          .upsert({
            challenge_id: challengeId,
            user_id: user.id,
            score: finalScore,
          }, {
            onConflict: "challenge_id,user_id"
          });
      }

      // Update multiplayer room if applicable
      if (gameMode === "multiplayer" && roomId) {
        await supabase
          .from("room_participants")
          .update({ score: finalScore, status: "finished" })
          .eq("room_id", roomId)
          .eq("user_id", user.id);
      }

      // Check and unlock achievements
      await checkAchievements(finalScore);

      if (finalScore > highScore) {
        setHighScore(finalScore);
        toast.success("New personal best! 🎉");
      }
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  };

  const checkAchievements = async (finalScore: number) => {
    if (!user) return;

    const { data: achievements } = await supabase
      .from("achievements")
      .select("*");

    if (!achievements) return;

    for (const achievement of achievements) {
      const req = achievement.requirement as any;
      let shouldUnlock = false;

      if (req.type === "score" && finalScore >= req.value) {
        shouldUnlock = true;
      } else if (req.type === "difficulty" && difficulty === req.value) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        const { error } = await supabase
          .from("user_achievements")
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          })
          .select();

        if (!error) {
          toast.success(`Achievement unlocked: ${achievement.name} ${achievement.icon}`);
        }
      }
    }
  };

  const flap = useCallback(() => {
    if (gameState === "menu") {
      return; // Don't start game from menu, use button
    } else if (gameState === "playing") {
      birdRef.current.velocity = FLAP_STRENGTH;
      soundEffects.playFlap();
    } else if (gameState === "gameOver") {
      resetGame();
      setGameState("playing");
      setTimeout(() => {
        birdRef.current.velocity = FLAP_STRENGTH;
        soundEffects.playFlap();
      }, 50);
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        flap();
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      e.preventDefault();
      flap();
    };

    const handleCanvasTouch = (e: TouchEvent) => {
      e.preventDefault();
      flap();
    };

    document.addEventListener("keydown", handleKeyPress);
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("touchstart", handleCanvasTouch);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("touchstart", handleCanvasTouch);
    };
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawBird = () => {
      const bird = birdRef.current;
      
      ctx.fillStyle = birdColors.body;
      ctx.fillRect(bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);
      
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

      ctx.fillStyle = "#000";
      ctx.fillRect(bird.x + 20, bird.y + 8, 6, 6);

      ctx.fillStyle = birdColors.accent;
      ctx.fillRect(bird.x + BIRD_SIZE, bird.y + 12, 8, 8);
      ctx.strokeRect(bird.x + BIRD_SIZE, bird.y + 12, 8, 8);
    };

    const drawPipe = (pipe: Pipe) => {
      ctx.fillStyle = "#6BCF7F";
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);

      ctx.fillStyle = "#5CBF6F";
      ctx.fillRect(pipe.x - 5, pipe.top - 25, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.top - 25, PIPE_WIDTH + 10, 25);

      ctx.fillStyle = "#6BCF7F";
      ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom - 100);
      ctx.strokeRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom - 100);

      ctx.fillStyle = "#5CBF6F";
      ctx.fillRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 25);
    };

    const drawGround = () => {
      const groundY = canvas.height - 100;
      
      ctx.fillStyle = "#DED895";
      ctx.fillRect(0, groundY, canvas.width, 100);
      
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      ctx.fillStyle = "#C8C080";
      for (let i = 0; i < canvas.width + 40; i += 40) {
        const x = (i - groundOffsetRef.current) % (canvas.width + 40);
        ctx.fillRect(x, groundY + 20, 30, 10);
        ctx.fillRect(x + 10, groundY + 40, 20, 10);
      }
    };

    const drawScore = () => {
      ctx.fillStyle = "#FFF";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.font = "bold 40px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      
      const scoreText = score.toString();
      ctx.strokeText(scoreText, canvas.width / 2, 60);
      ctx.fillText(scoreText, canvas.width / 2, 60);
    };

    const checkCollision = (): boolean => {
      const bird = birdRef.current;
      const groundY = canvas.height - 100;

      if (bird.y + BIRD_SIZE >= groundY || bird.y <= 0) {
        return true;
      }

      for (const pipe of pipesRef.current) {
        if (
          bird.x + BIRD_SIZE > pipe.x &&
          bird.x < pipe.x + PIPE_WIDTH &&
          (bird.y < pipe.top || bird.y + BIRD_SIZE > pipe.bottom)
        ) {
          return true;
        }
      }

      return false;
    };

    const gameLoop = () => {
      ctx.fillStyle = "#4EC0CA";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === "playing") {
        frameCountRef.current += 1;

        birdRef.current.velocity += settings.gravity;
        birdRef.current.y += birdRef.current.velocity;

        if (frameCountRef.current > 60) {
          if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < canvas.width - settings.pipeSpacing) {
            const minTop = 100;
            const maxTop = canvas.height - 100 - settings.pipeGap - 100;
            const top = Math.random() * (maxTop - minTop) + minTop;
            pipesRef.current.push({
              x: canvas.width,
              top,
              bottom: top + settings.pipeGap,
              passed: false,
            });
          }
        }

        pipesRef.current = pipesRef.current.filter((pipe) => {
          pipe.x -= settings.pipeSpeed;

          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdRef.current.x) {
            pipe.passed = true;
            soundEffects.playScore();
            setScore((s) => s + 1);
          }

          return pipe.x > -PIPE_WIDTH;
        });

        groundOffsetRef.current = (groundOffsetRef.current + settings.pipeSpeed) % 40;

        if (frameCountRef.current > 10 && checkCollision()) {
          soundEffects.playHit();
          soundEffects.playDie();
          setGameState("gameOver");
          submitScore(score);
        }
      }

      pipesRef.current.forEach(drawPipe);
      drawGround();
      drawBird();

      if (gameState === "playing") {
        drawScore();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, score, settings, birdColors, submitScore]);

  const handleStartSolo = () => {
    setGameMode("solo");
    setChallengeId(null);
    setRoomId(null);
    resetGame();
    setGameState("playing");
    setPageState("menu");
  };

  const handleStartDaily = (id: string, seed: string, diff: string) => {
    setGameMode("daily");
    setChallengeId(id);
    setRoomId(null);
    setDifficulty(diff as Difficulty);
    resetGame();
    setGameState("playing");
    setPageState("menu");
  };

  const handleStartMultiplayer = (id: string, seed: string, diff: string) => {
    setGameMode("multiplayer");
    setRoomId(id);
    setChallengeId(null);
    setDifficulty(diff as Difficulty);
    resetGame();
    setGameState("playing");
    setPageState("menu");
  };

  const handleBackToMenu = () => {
    setPageState("menu");
    setGameState("menu");
    resetGame();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-300">
        <p className="pixel-text text-white text-2xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-300">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-black shadow-2xl"
        />

        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 bg-white border-2 border-black p-2 hover:bg-gray-100 transition-colors z-20"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {gameState === "menu" && pageState === "menu" && (
          <MainMenu
            onStartGame={handleStartSolo}
            onNavigate={setPageState}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            birdSkin={birdSkin}
            setBirdSkin={setBirdSkin}
            username={profile.username}
            onSignOut={handleSignOut}
          />
        )}

        {pageState === "leaderboard" && (
          <Leaderboard onBack={handleBackToMenu} />
        )}

        {pageState === "achievements" && (
          <Achievements onBack={handleBackToMenu} userId={user.id} />
        )}

        {pageState === "daily" && (
          <DailyChallenge
            onBack={handleBackToMenu}
            onStartChallenge={handleStartDaily}
            userId={user.id}
          />
        )}

        {pageState === "multiplayer" && (
          <Multiplayer
            onBack={handleBackToMenu}
            onStartGame={handleStartMultiplayer}
            userId={user.id}
          />
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
            <h2 className="pixel-text text-white text-3xl mb-4">
              Game Over
            </h2>
            <div className="bg-white border-4 border-black p-6 mb-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <p className="pixel-text text-black text-sm mb-2">
                Score: {score}
              </p>
              <p className="pixel-text text-black text-sm">
                Best: {highScore}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => {
                  resetGame();
                  setGameState("playing");
                }}
                className="pixel-text"
              >
                Retry
              </Button>
              <Button
                onClick={handleBackToMenu}
                variant="outline"
                className="pixel-text"
              >
                Menu
              </Button>
            </div>
          </div>
        )}
      </div>

      {gameState === "playing" && (
        <p className="pixel-text text-white text-xs mt-6 opacity-80">
          Tap screen or press Space to flap
        </p>
      )}
    </div>
  );
};
