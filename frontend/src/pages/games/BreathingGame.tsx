import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Bubble {
  id: number;
  x: number;
  size: number;
  drift: number;
  duration: number;
}

export default function BreathingGame() {
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  /* ================= SPAWN BUBBLES ================= */
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newBubble: Bubble = {
        id: Date.now() + Math.random(),
        x: Math.random() * 90,
        size: 40 + Math.random() * 50,
        drift: (Math.random() - 0.5) * 200, // random left/right drift
        duration: 4000 + Math.random() * 3000, // 4–7 sec
      };

      setBubbles((prev) => [...prev, newBubble]);

      // Auto remove after duration
      setTimeout(() => {
        setBubbles((prev) =>
          prev.filter((b) => b.id !== newBubble.id)
        );
      }, newBubble.duration);

    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const popBubble = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setScore((prev) => prev + 1);
  };

  const startGame = () => {
    setTimeLeft(30);
    setScore(0);
    setBubbles([]);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#F3ECE6] flex flex-col items-center justify-center p-8 relative">

      {/* Back Button */}
      <button
        onClick={() => navigate("/app/games")}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-[#C060B0] hover:opacity-80"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-4xl font-black text-gray-900">
          Bubble Pop
        </h1>
        <p className="text-gray-600 text-sm">
          Pop as many bubbles as you can in 30 seconds!
        </p>
      </div>

      {/* Game Area */}
      <div className="relative w-full max-w-2xl h-[400px] bg-white rounded-3xl shadow-md overflow-hidden border border-white/80">

        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            onClick={() => popBubble(bubble.id)}
            className="absolute rounded-full bg-gradient-to-br from-[#F8E0C2] via-[#F0C7C3] to-[#D5D2FD] shadow-lg cursor-pointer"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: `${bubble.x}%`,
              bottom: "-80px",
              animation: `floatUp ${bubble.duration}ms linear forwards`,
              transform: `translateX(${bubble.drift}px)`
            }}
          />
        ))}

      </div>

      {/* Stats */}
      <div className="mt-6 bg-white rounded-2xl p-6 w-80 text-center space-y-3 shadow-md border border-white/80">
        <p className="text-sm text-gray-600">
          Time Remaining:
          <span className="text-gray-900 font-semibold ml-2">
            {timeLeft}s
          </span>
        </p>

        <p className="text-sm text-gray-600">
          Score:
          <span className="text-[#C060B0] font-semibold ml-2">
            {score}
          </span>
        </p>
      </div>

      {/* Start Button */}
      {!isPlaying && timeLeft === 30 && (
        <button
          onClick={startGame}
          className="mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#F8E0C2] to-[#D5D2FD] text-gray-900 font-semibold shadow-md hover:scale-105 transition"
        >
          Start Game
        </button>
      )}

      {/* Game Over */}
      {!isPlaying && timeLeft === 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 text-center space-y-4 shadow-lg border border-white/80">
          <h3 className="text-lg font-semibold text-gray-900">
            Time's Up! 🎉
          </h3>
          <p className="text-sm text-gray-600">
            You popped {score} bubbles!
          </p>
          <button
            onClick={startGame}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#F8E0C2] to-[#D5D2FD] text-gray-900 font-medium hover:scale-105 transition"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Animation CSS */}
      <style>
        {`
        @keyframes floatUp {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-600px);
          }
        }
        `}
      </style>

    </div>
  );
}