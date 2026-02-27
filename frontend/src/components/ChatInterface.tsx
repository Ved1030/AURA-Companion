import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Camera } from "lucide-react";
import Webcam from "react-webcam";

import AIVatar from "./AIVatar";
import VoiceModal from "@/components/VoiceModal";

interface Message {
  id: number;
  text: string;
  sender: "user" | "aura";
}

const ChatInterface = () => {
  const webcamRef = useRef<Webcam>(null);

  // ✅ NEW: session id for backend memory
  const sessionId = useRef(crypto.randomUUID());

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm AURA, your AI wellness companion.",
      sender: "aura",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [latestBlob, setLatestBlob] = useState<Blob | null>(null);

  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  const avatars = [
    "Avatar 1",
    "Avatar 2",
    "Avatar 3",
    "Avatar 4",
    "Avatar 5",
    "Avatar 6",
    "Avatar 7",
    "Avatar 8",
  ];

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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
        session_id: sessionId.current, // ✅ NEW
      }),
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: data.reply, sender: "aura" },
    ]);

    if (data.audio) playAudioFromBase64(data.audio);

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
    formData.append("session_id", sessionId.current); // ✅ NEW

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

            const sensitivity = 0.002;
            setSelectedAvatarIndex((prev) => {
              const next = prev + e.deltaY * sensitivity;
              return Math.max(
                0,
                Math.min(next, avatars.length - 1)
              );
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
                  key={index}
                  onClick={() => setSelectedAvatarIndex(index)}
                  className="absolute w-28 h-28 flex items-center justify-center rounded-full glass cursor-pointer transition-all duration-300 ease-out"
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
                  <span className="text-sm">{avatar}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER AVATAR */}
      <div className="flex flex-1 items-center justify-center">
        <div className="scale-125">
          <AIVatar audioBlob={latestBlob} />
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
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
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