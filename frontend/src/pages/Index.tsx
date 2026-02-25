import { motion } from "framer-motion";
import { Heart, Brain, Activity, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

import AuraOrb from "@/components/AuraOrb";
import EmotionPanel from "@/components/EmotionPanel";
import MoodTimeline from "@/components/MoodTimeline";
import InputModes from "@/components/InputModes";
import StatsCard from "@/components/StatsCard";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stats = [
  { icon: Heart, label: "Wellness Score", value: "86", change: "+12%", positive: true },
  { icon: Brain, label: "Sessions Today", value: "3", change: "+1", positive: true },
  { icon: Activity, label: "Stress Level", value: "23%", change: "-8%", positive: true },
  { icon: TrendingUp, label: "Mood Trend", value: "↑", change: "Improving", positive: true },
];

const Index = () => {
  const webcamRef = useRef<Webcam>(null);
  const [emotion, setEmotion] = useState("happy");
  const [confidence, setConfidence] = useState(0);

  const detectEmotion = async () => {
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) return;

      const response = await fetch("http://localhost:8000/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });

      const data = await response.json();

      if (!data.error) {
        setEmotion(data.dominant_emotion);
        setConfidence(data.confidence);
      }
    } catch (error) {
      console.error("Emotion detection error:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(detectEmotion, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold gradient-cyan-lavender mb-1">
          Welcome Back
        </h1>
        <p className="text-sm text-caption">
          Here's your emotional wellness overview
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </motion.div>

      {/* Camera + InputModes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* LEFT - Camera + Orb */}
        <motion.div
          variants={item}
          className="glass rounded-2xl p-8 flex flex-col items-center h-full"
        >
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={220}
            className="rounded-lg mb-6"
          />

          <AuraOrb emotion={emotion} size="lg" />

          <p className="text-sm font-medium mt-6">
            Current State:
            <span className="text-cyan capitalize ml-2">
              {emotion}
            </span>
          </p>

          <p className="text-xs text-caption mt-1">
            Confidence: {confidence.toFixed(2)}%
          </p>
        </motion.div>

        {/* RIGHT - InputModes (Equal Height, No Fake Box) */}
        <motion.div
          variants={item}
          className="flex h-full"
        >
          <div className="w-full flex flex-col justify-center">
            <InputModes />
          </div>
        </motion.div>

      </div>

      {/* Emotion Panel */}
      <motion.div variants={item}>
        <EmotionPanel />
      </motion.div>

      {/* Weekly Mood Timeline - Full Width */}
      <motion.div
        variants={item}
        className="glass rounded-2xl p-6"
      >
        <MoodTimeline />
      </motion.div>

    </motion.div>
  );
};

export default Index;