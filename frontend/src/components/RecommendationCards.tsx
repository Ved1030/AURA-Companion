import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Moon, Music, Dumbbell, BookOpen, Heart, X } from "lucide-react";

const recommendations = [
  {
    icon: Wind,
    title: "Breathing Exercise",
    category: "Relaxation",
  },
  {
    icon: Moon,
    title: "Sleep Meditation",
    category: "Sleep",
  },
  {
    icon: Music,
    title: "Mood-Boosting Playlist",
    category: "Music",
  },
  {
    icon: Dumbbell,
    title: "Stress Relief Workout",
    category: "Exercise",
  },
  {
    icon: BookOpen,
    title: "Journaling Prompt",
    category: "Mindfulness",
  },
  {
    icon: Heart,
    title: "Gratitude Practice",
    category: "Wellbeing",
  },
];

export default function RecommendationCards() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.title}
            onClick={() => setActive(rec.title)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass rounded-2xl p-5 cursor-pointer group"
          >
            <div className="flex justify-between mb-3">
              <rec.icon className="w-5 h-5 text-cyan" />
              <span className="text-[10px] uppercase tracking-wider text-caption">
                {rec.category}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-foreground">
              {rec.title}
            </h4>
            <p className="text-xs text-caption mt-2">Start →</p>
          </motion.div>
        ))}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-[90%] max-w-2xl shadow-xl relative"
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-4 right-4"
              >
                <X />
              </button>

              <h2 className="text-xl font-bold mb-4">{active}</h2>

              {/* Dynamic Content */}
              {active === "Breathing Exercise" && (
                <>
                  <p className="mb-4">
                    Try the 4-7-8 breathing technique:
                  </p>
                  <ul className="list-disc ml-5 mb-4 text-sm">
                    <li>Inhale for 4 seconds</li>
                    <li>Hold for 7 seconds</li>
                    <li>Exhale for 8 seconds</li>
                  </ul>
                  <iframe
                    className="w-full rounded-xl"
                    height="250"
                    src="https://www.youtube.com/embed/1Dv-ldGLnIY"
                    title="Breathing Exercise"
                    allowFullScreen
                  />
                </>
              )}

              {active === "Mood-Boosting Playlist" && (
                <>
                  <p className="mb-4">Relaxing & calming songs:</p>
                  <iframe
                    src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6"
                    width="100%"
                    height="300"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                  />
                </>
              )}

              {active === "Stress Relief Workout" && (
                <ul className="list-disc ml-5 text-sm space-y-2">
                  <li>Neck rolls (30 sec)</li>
                  <li>Shoulder shrugs (30 sec)</li>
                  <li>Forward fold stretch (1 min)</li>
                  <li>Light jumping jacks (1 min)</li>
                </ul>
              )}

              {active === "Journaling Prompt" && (
                <textarea
                  placeholder="What emotions did you feel most strongly today?"
                  className="w-full h-40 border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              )}

              {active === "Gratitude Practice" && (
                <ul className="space-y-2 text-sm">
                  <li>• Write 3 things you're grateful for</li>
                  <li>• Appreciate someone who helped you</li>
                  <li>• Reflect on one positive moment today</li>
                </ul>
              )}

              {active === "Sleep Meditation" && (
                <>
                  <p className="mb-4">
                    Guided body scan meditation before sleep.
                  </p>
                  <iframe
                    className="w-full rounded-xl"
                    height="250"
                    src="https://www.youtube.com/embed/ZToicYcHIOU"
                    title="Sleep Meditation"
                    allowFullScreen
                  />
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}