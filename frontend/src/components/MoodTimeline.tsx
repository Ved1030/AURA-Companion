import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const weeklyData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 80 },
  { day: "Wed", score: 65 },
  { day: "Thu", score: 78 },
  { day: "Fri", score: 88 },
  { day: "Sat", score: 90 },
  { day: "Sun", score: 76 },
];

const monthlyData = [
  { day: "Week 1", score: 70 },
  { day: "Week 2", score: 75 },
  { day: "Week 3", score: 82 },
  { day: "Week 4", score: 78 },
];

export default function MoodTimeline() {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");

  const data = mode === "weekly" ? weeklyData : monthlyData;

  const average =
    Math.round(
      data.reduce((acc, curr) => acc + curr.score, 0) / data.length
    ) || 0;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-inner">

      {/* Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "weekly"
              ? "Weekly Mood Timeline"
              : "Monthly Mood Timeline"}
          </h3>
          <p className="text-sm text-gray-600">
            {mode === "weekly"
              ? "Your emotional journey this week"
              : "Your emotional trend this month"}
          </p>
        </div>

        <div className="flex bg-white rounded-full p-1 shadow-sm">
          <button
            onClick={() => setMode("weekly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mode === "weekly"
                ? "bg-gradient-to-r from-[#F8E0C2] to-[#F5D6FF]"
                : "text-gray-600"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mode === "monthly"
                ? "bg-gradient-to-r from-[#F8E0C2] to-[#F5D6FF]"
                : "text-gray-600"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" stroke="#6B7280" />
            <YAxis domain={[50, 100]} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                borderRadius: "1rem",
                border: "none",
                boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#C084FC"
              strokeWidth={4}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Average Score */}
      <div className="mt-6 text-sm text-gray-700">
        Wellness Score <span className="font-semibold ml-2">Avg: {average}%</span>
      </div>
    </div>
  );
}