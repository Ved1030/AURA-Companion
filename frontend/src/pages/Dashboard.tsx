import { motion } from "framer-motion";
import { Heart, Brain, Activity, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

import AuraOrb from "@/components/AuraOrb";
import EmotionPanel from "@/components/EmotionPanel";
import MoodTimeline from "@/components/MoodTimeline";
import InputModes from "@/components/InputModes";
import StatsCard from "@/components/StatsCard";

type InputMode = "camera" | "voice" | "text";

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const [emotion, setEmotion] = useState<string>("Detecting...");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [emotions, setEmotions] = useState<Record<string, number>>({});
  const [textInput, setTextInput] = useState<string>("");

  /* ---------------- CAMERA ---------------- */

  const detectEmotion = async () => {
    if (inputMode !== "camera") return;

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) return;

      const response = await fetch("http://127.0.0.1:8000/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });

      const data = await response.json();

      if (data.results?.length > 0) {
        const result = data.results[0];
        setEmotion(result.emotion);
        setConfidence(result.confidence);
        setEmotions({ [result.emotion]: result.confidence });
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  useEffect(() => {
    if (inputMode === "camera") {
      const interval = setInterval(detectEmotion, 1500);
      return () => clearInterval(interval);
    }
  }, [inputMode]);

  /* ---------------- TEXT ---------------- */

  const handleTextDetection = async () => {
    if (!textInput) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/text-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });

      const data = await response.json();

      setEmotion(data.emotion);
      setConfidence(data.confidence);
      setEmotions({ [data.emotion]: data.confidence });
    } catch (error) {
      console.error("Text error:", error);
    }
  };

  /* ---------------- VOICE ---------------- */

  const handleVoiceDetection = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = async (event: any) => {
    const transcript = event.results[0][0].transcript;

    const response = await fetch("http://127.0.0.1:8000/text-emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: transcript }),
    });

    const data = await response.json();

    setEmotion(data.emotion);
    setConfidence(data.confidence);
    setEmotions({ [data.emotion]: data.confidence });
  };

  recognition.start();
};

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden min-h-screen bg-[#FFFFFF] p-6 lg:p-10 space-y-10"
    >

    <div className="absolute inset-0 -z-10">
    <div className="blob-peach w-[500px] h-[500px] absolute top-20 left-0 opacity-25" />
    <div className="blob-lavender w-[500px] h-[500px] absolute bottom-10 right-0 opacity-25" />
    </div>

      {/* HEADER */}
      <motion.div variants={item}>
        <h1 className="text-4xl font-heading font-bold text-gray-900">
          Welcome Back
        </h1>
        <p className="text-subtle-aura font-medium mt-2">
          Here's your emotional wellness overview
        </p>
      </motion.div>

      {/* STATS GRID */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-[2rem] p-6 shadow-md border border-white/80"
          >
            <StatsCard {...s} />
          </div>
        ))}
      </motion.div>

      {/* MAIN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT SECTION */}
        <motion.div
          variants={item}
          className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-lg border border-white/80"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">


            <div className="flex flex-col items-center">

              {inputMode === "camera" && (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={240}
                  className="rounded-xl shadow-md mb-6"
                />
              )}

              {inputMode === "voice" && (
                <button
                  onClick={handleVoiceDetection}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl mb-6"
                >
                  Start Voice Detection
                </button>
              )}

              {inputMode === "text" && (
                <div className="flex flex-col items-center w-full">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type how you feel..."
                    className="w-64 p-3 border rounded-xl mb-3"
                  />
                  <button
                    onClick={handleTextDetection}
                    className="px-5 py-2 bg-purple-500 text-white rounded-xl"
                  >
                    Analyze Text
                  </button>
                </div>
              )}

              <p className="text-sm font-semibold text-gray-700 mt-4">
                Current State:
                <span className="ml-2 capitalize text-[#C060B0]">
                  {emotion}
                </span>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Confidence:{" "}
                {confidence !== null ? `${confidence.toFixed(2)}%` : "--"}
              </p>
            </div>


            <div className="flex justify-center">
              <AuraOrb emotion={emotion} size="lg" />
            </div>

          </div>
        </motion.div>

        {/* RIGHT SECTION */}
        <motion.div
          variants={item}
          className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-white/80 flex flex-col justify-center"
        >
          <InputModes
            selected={inputMode}
            onSelect={(mode: InputMode) => setInputMode(mode)}
          />
        </motion.div>

      </div>


      <motion.div
        variants={item}
        className="bg-white rounded-[2.5rem] p-8 shadow-md border border-white/80"
      >
        <EmotionPanel emotions={emotions} />
      </motion.div>


      <motion.div
        variants={item}
        className="bg-gradient-to-br from-[#F8E0C2] via-[#F5D6FF] to-[#D5D2FD] rounded-[2.5rem] p-8 shadow-lg"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Mood Timeline
          </h2>
          <p className="text-sm text-gray-700">
            Track your emotional pattern weekly and monthly
          </p>
        </div>


        <MoodTimeline />
      </motion.div>

    </motion.div>
  );
};

export default Index;