import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DifficultySelector } from "@/components/DifficultySelector";
import { BirdSkinSelector } from "@/components/BirdSkinSelector";
import { soundEffects } from "@/utils/soundEffects";
import { 
  Difficulty, 
  BirdSkin, 
  DIFFICULTY_SETTINGS, 
  BIRD_SKINS 
} from "@/types/game";
import { Volume2, VolumeX } from "lucide-react";

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

type GameState = "title" | "playing" | "gameOver";

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("title");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem("flappyHighScore") || "0");
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [birdSkin, setBirdSkin] = useState<BirdSkin>("yellow");
  const [isMuted, setIsMuted] = useState(false);

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

  const flap = useCallback(() => {
    if (gameState === "title") {
      resetGame();
      setGameState("playing");
      setTimeout(() => {
        birdRef.current.velocity = FLAP_STRENGTH;
        soundEffects.playFlap();
      }, 50);
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

    // Only attach click/touch to canvas, not whole document
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
      
      // Bird body
      ctx.fillStyle = birdColors.body;
      ctx.fillRect(bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);
      
      // Bird border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(bird.x, bird.y, BIRD_SIZE, BIRD_SIZE);

      // Eye
      ctx.fillStyle = "#000";
      ctx.fillRect(bird.x + 20, bird.y + 8, 6, 6);

      // Beak
      ctx.fillStyle = birdColors.accent;
      ctx.fillRect(bird.x + BIRD_SIZE, bird.y + 12, 8, 8);
      ctx.strokeRect(bird.x + BIRD_SIZE, bird.y + 12, 8, 8);
    };

    const drawPipe = (pipe: Pipe) => {
      // Top pipe
      ctx.fillStyle = "#6BCF7F";
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);

      // Top pipe cap
      ctx.fillStyle = "#5CBF6F";
      ctx.fillRect(pipe.x - 5, pipe.top - 25, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.top - 25, PIPE_WIDTH + 10, 25);

      // Bottom pipe
      ctx.fillStyle = "#6BCF7F";
      ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom - 100);
      ctx.strokeRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom - 100);

      // Bottom pipe cap
      ctx.fillStyle = "#5CBF6F";
      ctx.fillRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 25);
    };

    const drawGround = () => {
      const groundY = canvas.height - 100;
      
      // Ground
      ctx.fillStyle = "#DED895";
      ctx.fillRect(0, groundY, canvas.width, 100);
      
      // Ground border
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Ground details
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

      // Ground collision
      if (bird.y + BIRD_SIZE >= groundY || bird.y <= 0) {
        return true;
      }

      // Pipe collision
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
      // Clear canvas
      ctx.fillStyle = "#4EC0CA";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === "playing") {
        frameCountRef.current += 1;

        // Update bird
        birdRef.current.velocity += settings.gravity;
        birdRef.current.y += birdRef.current.velocity;

        // Update and spawn pipes (start after grace period)
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

          // Update score
          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdRef.current.x) {
            pipe.passed = true;
            soundEffects.playScore();
            setScore((s) => s + 1);
          }

          return pipe.x > -PIPE_WIDTH;
        });

        // Update ground
        groundOffsetRef.current = (groundOffsetRef.current + settings.pipeSpeed) % 40;

        // Check collision (after grace period)
        if (frameCountRef.current > 10 && checkCollision()) {
          soundEffects.playHit();
          soundEffects.playDie();
          setGameState("gameOver");
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("flappyHighScore", score.toString());
          }
        }
      }

      // Draw everything
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
  }, [gameState, score, highScore, settings, birdColors]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-primary/80">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-black shadow-2xl"
        />

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 bg-white border-2 border-black p-2 hover:bg-gray-100 transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {gameState === "title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/20">
            <h1 className="pixel-text text-white text-4xl mb-8">
              Flappy Bird
            </h1>
            
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            <BirdSkinSelector selected={birdSkin} onSelect={setBirdSkin} />
            
            <p className="pixel-text text-white text-sm mb-4">
              Tap or Press Space
            </p>
            <Button
              onClick={flap}
              className="game-button bg-accent text-black hover:bg-accent/90"
            >
              Play
            </Button>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
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
            <Button
              onClick={flap}
              className="game-button bg-accent text-black hover:bg-accent/90"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      <p className="pixel-text text-white text-xs mt-6 opacity-80">
        Tap screen or press Space to flap
      </p>
    </div>
  );
};
