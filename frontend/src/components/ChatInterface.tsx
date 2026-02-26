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

  const [currentEmotion, setCurrentEmotion] =
    useState<string>("neutral");
  const [confidence, setConfidence] =
    useState<number | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 🔥 IMPORTANT: Now triggers lip sync via AIVatar
  const playAudioFromBase64 = (base64Audio: string) => {
    const byteCharacters = atob(base64Audio);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] =
        byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "audio/wav",
    });

    setLatestBlob(blob); // 👈 This drives avatar lip sync
  };

  // 🧠 Emotion-based conversation starter
  const triggerEmotionConversation = async (
    emotion: string
  ) => {
    let starterText = "";

    switch (emotion) {
      case "sad":
        starterText =
          "You seem a little down. Want to talk about it?";
        break;
      case "happy":
        starterText =
          "You look happy today! What's making you smile?";
        break;
      case "angry":
        starterText =
          "I sense some frustration. Do you want to share what happened?";
        break;
      case "fear":
        starterText =
          "You seem a bit anxious. I'm here with you. What's going on?";
        break;
      case "surprise":
        starterText =
          "You look surprised! Something unexpected happened?";
        break;
      case "disgust":
        starterText =
          "Something doesn't feel right? Tell me what's bothering you.";
        break;
      default:
        starterText =
          "How are you feeling right now?";
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/assistant",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: starterText,
            emotion,
          }),
        }
      );

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: data.reply,
          sender: "aura",
        },
      ]);

      if (data.audio)
        playAudioFromBase64(data.audio);
    } catch (err) {
      console.error(
        "Auto conversation failed:",
        err
      );
    }
  };

  // 🔥 ONE-TIME EMOTION DETECTION
  useEffect(() => {
    const detectOnce = async () => {
      if (!webcamRef.current) return;

      const imageSrc =
        webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/emotion",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              image: imageSrc,
            }),
          }
        );

        const data = await response.json();

        if (
          data.results &&
          data.results.length > 0
        ) {
          const result = data.results[0];

          setCurrentEmotion(result.emotion);
          setConfidence(result.confidence);

          if (result.confidence > 50) {
            triggerEmotionConversation(
              result.emotion
            );
          }
        }
      } catch (err) {
        console.error(
          "Emotion detection error:",
          err
        );
      }
    };

    const timeout = setTimeout(
      detectOnce,
      1500
    );
    return () => clearTimeout(timeout);
  }, []);

  const sendTextMessage = async (
    text: string
  ) => {
    setLoading(true);

    const response = await fetch(
      "http://127.0.0.1:8000/assistant",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          text,
          emotion: currentEmotion,
        }),
      }
    );

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: data.reply,
        sender: "aura",
      },
    ]);

    if (data.audio)
      playAudioFromBase64(data.audio);

    setLoading(false);
  };

  const sendVoiceMessage = async (
    audioBlob: Blob
  ) => {
    setLoading(true);

    const formData = new FormData();
    formData.append(
      "audio",
      audioBlob,
      "recording.wav"
    );
    formData.append(
      "emotion",
      currentEmotion
    );

    const response = await fetch(
      "http://127.0.0.1:8000/assistant",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: data.user_text,
        sender: "user",
      },
      {
        id: Date.now() + 1,
        text: data.reply,
        sender: "aura",
      },
    ]);

    if (data.audio)
      playAudioFromBase64(data.audio);

    setLoading(false);
  };

  const startRecording = async () => {
    const stream =
      await navigator.mediaDevices.getUserMedia(
        { audio: true }
      );
    const mediaRecorder =
      new MediaRecorder(stream);

    mediaRecorderRef.current =
      mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (
      event
    ) => {
      audioChunks.current.push(
        event.data
      );
    };

    mediaRecorder.start();
  };

  const stopRecording = (): Promise<
    Blob | null
  > => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop =
        () => {
          const blob = new Blob(
            audioChunks.current,
            { type: "audio/wav" }
          );
          setLatestBlob(blob);
          resolve(blob);
        };

      mediaRecorderRef.current.stop();
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: input,
        sender: "user",
      },
    ]);

    sendTextMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex flex-col items-center">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={160}
            className="rounded-xl border border-cyan"
          />
          <p className="text-xs mt-2 capitalize">
            Emotion: {currentEmotion}
          </p>
          <p className="text-xs text-caption">
            Confidence:{" "}
            {confidence
              ? confidence.toFixed(2) + "%"
              : "--"}
          </p>
        </div>

        {/* UI UNCHANGED */}
        <AIVatar audioBlob={latestBlob} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
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
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              sendMessage()
            }
          />

          <button
            onClick={sendMessage}
            className="p-2 text-cyan"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showVoiceModal && (
        <VoiceModal
          onStop={async () => {
            const blob =
              await stopRecording();
            if (blob)
              await sendVoiceMessage(blob);
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