import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Camera, X } from "lucide-react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

import AIVatar from "./AIVatar";
import VoiceModal from "@/components/VoiceModal";
import avatar1 from "@/assets/avatar/avatar1.png";
import avatar2 from "@/assets/avatar/avatar2.png";
import avatar3 from "@/assets/avatar/avatar3.png";

interface Message {
  id: number;
  text: string;
  sender: "user" | "aura";
}

interface Avatar {
  id: number;
  name: string;
  image: string;
  modelUrl: string;
  sarvamModel: string;
}

interface Game {
  id: string;
  name: string;
  description: string;
  emotion: string[];
  icon: string;
  route: string;
}

const ChatInterface = () => {
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();

  // avatars configuration - each object carries required metadata
  const avatars: Avatar[] = [
    {
      id: 0,
      name: "Calm Aura",
      image: avatar1, // adjust to real paths
      modelUrl: "https://models.readyplayer.me/69a279d84d98c76821c317a1.glb",
      sarvamModel: "sarvam-therapy-v1anushkamaleshubhanushka",
    },
    {
      id: 1,
      name: "Joy Aura",
      image: avatar2,
      modelUrl: "https://models.readyplayer.me/69a26c875f0ce8d116ba5d5b.glb",
      sarvamModel: "sarvam-energetic-v1hubhrya",
    },
    {
      id: 2,
      name: "Zen Aura",
      image: avatar3,
      modelUrl: "https://models.readyplayer.me/69a27a2a2b9bcc76d538bf8a.glb",
      sarvamModel: "sarvam-meditation-v1ituidya",
    },
    // add more avatars as needed
  ];

  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);

  // map avatarId -> { sessionId, messages }
  const [avatarSessions, setAvatarSessions] = useState<{
    [key: number]: { sessionId: string; messages: Message[] };
  }>(() => {
    const firstId = avatars[0].id;
    return {
      [firstId]: {
        sessionId: crypto.randomUUID(),
        messages: [
          {
            id: 1,
            text: "Hello! I'm AURA, your AI wellness companion.",
            sender: "aura",
          },
        ],
      },
    };
  });

  // derive current avatar & messages/session
  const currentAvatar = avatars[selectedAvatarIndex];
  const currentSessionId =
    avatarSessions[currentAvatar.id]?.sessionId ||
    crypto.randomUUID();

  const [messages, setMessages] = useState<Message[]>(
    avatarSessions[currentAvatar.id]?.messages || []
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [latestBlob, setLatestBlob] = useState<Blob | null>(null);

  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  // Game recommendation state
  const [gameRecommendationShown, setGameRecommendationShown] = useState<{ [key: number]: boolean }>({});
  const [suggestedGames, setSuggestedGames] = useState<Game[]>([]);
  const [userDeclinedGames, setUserDeclinedGames] = useState<{ [key: number]: boolean }>({});

  // Game data - matches the 6 games in pages/games
  const games: Game[] = [
    { id: "breathing", name: "Breathing", description: "Calm your mind with guided breathing", emotion: ["sad", "angry", "fear"], icon: "🌬️", route: "/app/games/breathing" },
    { id: "color", name: "Color Game", description: "Relax with calming colors", emotion: ["sad", "neutral"], icon: "🎨", route: "/app/games/color" },
    { id: "gratitude", name: "Gratitude", description: "Count your blessings", emotion: ["sad", "neutral", "happy"], icon: "🙏", route: "app/games/gratitude" },
    { id: "maze", name: "Maze", description: "Challenge your mind", emotion: ["neutral", "happy"], icon: "🎯", route: "/app/games/maze" },
    { id: "memory", name: "Memory", description: "Train your memory", emotion: ["neutral", "happy"], icon: "🧠", route: "/app/games/memory" },
    { id: "zen", name: "Zen", description: "Find inner peace", emotion: ["sad", "angry", "fear"], icon: "☮️", route: "/app/games/zen" },
  ];

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  /* ===================== */
  /* 🎮 GAME RECOMMENDATION */
  /* ===================== */
  const getRecommendedGames = (emotion: string): Game[] => {
    const emotionLower = emotion.toLowerCase();
    return games.filter(game => game.emotion.includes(emotionLower)).slice(0, 3);
  };

  const shouldShowGameRecommendation = (): boolean => {
    const sessionId = avatarSessions[currentAvatar.id]?.sessionId;
    if (!sessionId || gameRecommendationShown[currentAvatar.id] || userDeclinedGames[currentAvatar.id]) {
      return false;
    }
    // Count AI responses (messages from "aura")
    const auraResponseCount = messages.filter(msg => msg.sender === "aura").length;
    // Show on 2nd or 3rd response (trigger when we reach 2 or 3 AI messages)
    return auraResponseCount === 2 || auraResponseCount === 3;
  };

  // Trigger game recommendation when conditions are met
  useEffect(() => {
    if (shouldShowGameRecommendation()) {
      const recommendedGames = getRecommendedGames(currentEmotion);
      setSuggestedGames(recommendedGames);
      setGameRecommendationShown(prev => ({
        ...prev,
        [currentAvatar.id]: true
      }));
      
      // Add a human-friendly AI message suggesting games
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `By the way, based on how you're feeling right now, you might enjoy trying one of these games. Want to give any a shot?`,
          sender: "aura"
        }
      ]);
    }
  }, [messages, currentEmotion, currentAvatar.id]);

  /* ===================== */
  /* 🔊 AUDIO + LIP SYNC  */
  /* ===================== */
  const playAudioFromBase64 = (base64Audio: string) => {
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "audio/wav" });

    // 🔥 Drives lip sync ONLY
    setLatestBlob(blob);
  };

  /* ===================== */
  /* 🧠 EMOTION DETECTION  */
  /* ===================== */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const detectEmotion = async () => {
      if (!webcamRef.current) return;
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageSrc }),
        });

        const data = await response.json();

        if (data.results?.length > 0) {
          const result = data.results[0];
          setCurrentEmotion(result.emotion);
          setConfidence(result.confidence);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timeout = setTimeout(() => {
      detectEmotion();
      interval = setInterval(detectEmotion, 2000);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  /* ================================= */
  /* 🔁 AVATAR SESSION MANAGEMENT     */
  /* ================================= */
  // when messages change for the current avatar, persist them
  useEffect(() => {
    setAvatarSessions((prev) => ({
      ...prev,
      [currentAvatar.id]: {
        sessionId: prev[currentAvatar.id]?.sessionId || currentSessionId,
        messages,
      },
    }));
  }, [messages, currentAvatar.id]);

  // when user switches avatars, load that avatar's messages
  useEffect(() => {
    const stored = avatarSessions[currentAvatar.id];
    if (stored) {
      setMessages(stored.messages);
    } else {
      // initialize a blank conversation for new avatar
      setMessages([]);
      setAvatarSessions((prev) => ({
        ...prev,
        [currentAvatar.id]: {
          sessionId: currentSessionId,
          messages: [],
        },
      }));
    }
  }, [selectedAvatarIndex]);

  // Reset game recommendations when switching avatars
  useEffect(() => {
    setSuggestedGames([]);
  }, [selectedAvatarIndex]);

  /* ===================== */
  /* 🧠 SEND TEXT MESSAGE  */
  /* ===================== */
  const sendTextMessage = async (text: string) => {
    setLoading(true);

    const response = await fetch("http://127.0.0.1:8000/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        emotion: currentEmotion,
        avatar_name: currentAvatar.name,
        avatar_model: currentAvatar.sarvamModel,
        session_id: currentSessionId,
      }),
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: data.reply, sender: "aura" },
    ]);

if (data.audio) {
  console.log("✅ Backend audio received");
  playAudioFromBase64(data.audio);
} else {
  console.log("❌ No audio returned from backend");
}
    setLoading(false);
  };

  /* ===================== */
  /* 🎤 SEND VOICE MESSAGE */
  /* ===================== */
  const sendVoiceMessage = async (audioBlob: Blob) => {
    setLoading(true);

    // setLatestBlob(audioBlob);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("emotion", currentEmotion);
    formData.append("avatar_name", currentAvatar.name);
    formData.append("avatar_model", currentAvatar.sarvamModel);
    formData.append("session_id", currentSessionId);

    const response = await fetch("http://127.0.0.1:8000/assistant", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: data.user_text, sender: "user" },
      { id: Date.now() + 1, text: data.reply, sender: "aura" },
    ]);

    if (data.audio) playAudioFromBase64(data.audio);

    setLoading(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.start();
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks.current, {
          type: "audio/mpeg",
        });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input, sender: "user" },
    ]);

    sendTextMessage(input);
    setInput("");
  };

  /* ===================== */
  /* 🎨 UI LAYOUT          */
  /* ===================== */
  return (
    <div className="flex h-full overflow-hidden">

      {/* LEFT PANEL */}
      <div className="w-[260px] flex flex-col items-center p-6 border-r border-border/50">

        {/* Camera */}
        <div className="flex flex-col items-center">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={180}
            className="rounded-xl border border-cyan"
          />
          <p className="text-xs mt-2 capitalize">
            Emotion: {currentEmotion}
          </p>
          <p className="text-xs text-caption">
            Confidence: {confidence ? confidence.toFixed(2) + "%" : "--"}
          </p>
        </div>

        <div className="mt-14" />

        {/* Smooth Vertical Carousel */}
        <div
          onWheel={(e) => {
            e.preventDefault();
            // move one avatar per scroll step
            const step = e.deltaY > 0 ? 1 : -1;
            setSelectedAvatarIndex((prev) => {
              const next = prev + step;
              return Math.max(0, Math.min(next, avatars.length - 1));
            });
          }}
          className="relative h-[320px] w-full flex items-center justify-center overflow-hidden"
        >
          <div className="relative h-full w-full flex items-center justify-center">
            {avatars.map((avatar, index) => {
              const offset = index - selectedAvatarIndex;
              if (Math.abs(offset) > 2) return null;

              const scale = 1 - Math.abs(offset) * 0.15;
              const opacity = 1 - Math.abs(offset) * 0.3;

              return (
                <div
                  key={avatar.id}
                  onClick={() => setSelectedAvatarIndex(index)}
                  className="absolute w-28 h-28 flex items-center justify-center rounded-full glass cursor-pointer overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    transform: `
                      translateY(${offset * 100}px)
                      scale(${scale})
                      rotateX(${offset * -18}deg)
                    `,
                    opacity,
                    zIndex: 10 - Math.abs(offset),
                  }}
                >
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER AVATAR */}
      <div className="flex flex-1 items-center justify-center">
        <div className="scale-125">
          <AIVatar audioBlob={latestBlob} modelUrl={currentAvatar.modelUrl} />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[400px] flex flex-col border-l border-border/50">
        <div className="flex-1 overflow-y-auto px-4 space-y-4 py-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "gradient-bg-cyan text-primary-foreground"
                      : "glass text-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Game Recommendation Card */}
          {suggestedGames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 bg-gradient-to-br from-cyan-100/40 to-purple-100/40 rounded-2xl border border-cyan-200/50 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-800">✨ I have some suggestions for you:</p>
                <button
                  onClick={() => {
                    setUserDeclinedGames(prev => ({ ...prev, [currentAvatar.id]: true }));
                    setSuggestedGames([]);
                  }}
                  className="p-1.5 hover:bg-white/50 rounded-full transition"
                  title="Maybe later"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestedGames.map((game) => (
                  <motion.button
                    key={game.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      navigate(game.route);
                    }}
                    className="p-3 bg-white hover:bg-cyan-50 rounded-xl border-2 border-cyan-200/50 hover:border-cyan-300 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="text-2xl mb-2">{game.icon}</div>
                    <div className="text-xs font-bold text-gray-800">{game.name}</div>
                    <div className="text-xs text-gray-600 leading-tight">{game.description}</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">Click any game to play</p>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
            <Camera className="w-4 h-4" />
            <button
              onClick={() => {
                setShowVoiceModal(true);
                startRecording();
              }}
              className="p-2 text-cyan"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Tell AURA how you're feeling..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="p-2 text-cyan">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showVoiceModal && (
        <VoiceModal
          onStop={async () => {
            const blob = await stopRecording();
            setShowVoiceModal(false);
            if (blob) sendVoiceMessage(blob);
          }}
          onCancel={() => {
            mediaRecorderRef.current?.stop();
            setShowVoiceModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatInterface;