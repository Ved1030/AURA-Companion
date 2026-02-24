import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Camera } from "lucide-react";
import AIVatar from "./AIVatar";
import VoiceModal from "@/components/VoiceModal";

interface Message {
  id: number;
  text: string;
  sender: "user" | "aura";
  emotion?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm AURA, your AI wellness companion. How are you feeling today?",
      sender: "aura",
      emotion: "calm",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [latestBlob, setLatestBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 🔊 Play backend audio
  const playAudioFromBase64 = (base64Audio: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play().catch(console.error);
  };

  // 🧠 TEXT MESSAGE
  const sendTextMessage = async (text: string) => {
    setLoading(true);

    const response = await fetch("http://127.0.0.1:8000/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: data.reply, sender: "aura" },
    ]);

    if (data.audio) playAudioFromBase64(data.audio);

    setLoading(false);
  };

  // 🎤 VOICE MESSAGE
  const sendVoiceMessage = async (audioBlob: Blob) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

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

  // 🎤 START RECORDING
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

  // ⏹ STOP RECORDING AND RETURN BLOB
  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        setLatestBlob(blob);
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  // 🧠 SEND TEXT FROM INPUT
  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input, sender: "user" },
    ]);

    sendTextMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">

      {/* Avatar */}
      <div className="flex items-center justify-center py-6">
        <AIVatar audioBlob={latestBlob} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
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
      </div>

      {/* Input */}
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

      {/* 🎤 VOICE MODAL */}
      {showVoiceModal && (
        <VoiceModal
          onStop={async () => {
            const blob = await stopRecording();
            if (blob) {
              await sendVoiceMessage(blob);
            }
            setShowVoiceModal(false);
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