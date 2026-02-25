import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Phase = "inhale" | "hold" | "exhale" | "idle" | "complete";

export default function BreathingGame() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(60);
  const [scale, setScale] = useState(1);
  const [cycles, setCycles] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;
    if (timeLeft <= 0) {
      setPhase("complete");
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  // Breathing phase loop
  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;

    let timer: NodeJS.Timeout;

    if (phase === "inhale") {
      setScale(1.4);
      timer = setTimeout(() => setPhase("hold"), 4000);
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("exhale"), 4000);
    } else if (phase === "exhale") {
      setScale(1);
      timer = setTimeout(() => {
        setCycles((c) => c + 1);
        setPhase("inhale");
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const startSession = () => {
    setPhase("inhale");
    setTimeLeft(60);
    setCycles(0);
  };

  const getInstruction = () => {
    switch (phase) {
      case "inhale":
        return "Inhale Slowly...";
      case "hold":
        return "Hold...";
      case "exhale":
        return "Exhale Gently...";
      case "complete":
        return "Session Complete 🌿";
      default:
        return "Ready to Begin?";
    }
  };

  return (
    <div className="p-6 lg:p-10 h-full flex flex-col items-center justify-center space-y-10 relative">

      {/* Back Button */}
      <button
        onClick={() => navigate("/games")}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-primary hover:opacity-80"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-cyan-lavender">
          Breathing Bubbles
        </h1>
        <p className="text-sm text-caption">
          Calm your nervous system with guided breathing
        </p>
      </div>

      {/* Breathing Orb */}
      <div className="relative flex items-center justify-center">
        <div
          className="rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 transition-all duration-[4000ms] ease-in-out"
          style={{
            width: 240,
            height: 240,
            transform: `scale(${scale})`,
          }}
        />
        <div className="absolute text-center">
          <p className="text-lg font-semibold text-heading">
            {getInstruction()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-3xl p-6 w-80 text-center space-y-3">
        <p className="text-sm text-caption">
          Time Remaining: <span className="text-heading">{timeLeft}s</span>
        </p>
        <p className="text-sm text-caption">
          Completed Cycles: <span className="text-primary font-semibold">{cycles}</span>
        </p>
      </div>

      {/* Controls */}
      {phase === "idle" && (
        <button
          onClick={startSession}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition"
        >
          <Play className="w-4 h-4" />
          Start Session
        </button>
      )}

      {phase === "complete" && (
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <h3 className="text-lg font-semibold text-heading">
            Great Work 🌿
          </h3>
          <p className="text-sm text-caption">
            You completed {cycles} breathing cycles.
          </p>
          <button
            onClick={startSession}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}