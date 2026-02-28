import { motion } from "framer-motion";
import { Camera, Mic, Type } from "lucide-react";

type InputMode = "camera" | "voice" | "text";

interface InputModesProps {
  selected: InputMode;
  onSelect: (mode: InputMode) => void;
}

const modes = [
  {
    id: "camera",
    icon: Camera,
    label: "Face",
    desc: "Facial Expression Analysis",
  },
  {
    id: "voice",
    icon: Mic,
    label: "Voice",
    desc: "Voice Tone Detection",
  },
  {
    id: "text",
    icon: Type,
    label: "Text",
    desc: "Text Sentiment Analysis",
  },
];

const InputModes = ({ selected, onSelect }: InputModesProps) => {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Input Modes
      </h3>
      <p className="text-xs text-caption mb-4">
        Multimodal emotion detection
      </p>

      {/* Mode Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => onSelect(mode.id as InputMode)}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              selected === mode.id
                ? "gradient-bg-cyan text-primary-foreground glow-cyan"
                : "bg-muted/50 text-caption hover:bg-muted"
            }`}
          >
            <mode.icon className="w-5 h-5" />
            <span className="text-xs font-medium">
              {mode.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Description Panel */}
      <div className="mt-4 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          <span className="text-[11px] text-cyan font-medium">
            {modes.find((m) => m.id === selected)?.desc}
          </span>
        </div>

        <p className="text-[10px] text-caption">
          {selected === "camera" &&
            "Camera access required for real-time facial expression tracking"}

          {selected === "voice" &&
            "Microphone access required for voice pattern analysis"}

          {selected === "text" &&
            "Type naturally — AI analyzes sentiment and emotional cues"}
        </p>
      </div>
    </div>
  );
};

export default InputModes;