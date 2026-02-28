import { motion } from "framer-motion";
import MoodTimeline from "@/components/MoodTimeline";
import EmotionPanel from "@/components/EmotionPanel";
import StatsCard from "@/components/StatsCard";
import { Calendar, Clock, Zap, Target } from "lucide-react";
import { useState } from "react";

const analyticsStats = [
  { icon: Calendar, label: "Days Tracked", value: "28", change: "Streak!", positive: true },
  { icon: Clock, label: "Avg Session", value: "12m" },
  { icon: Zap, label: "Insights Generated", value: "47", change: "+8", positive: true },
  { icon: Target, label: "Goals Met", value: "5/7", change: "71%", positive: true },
];

const Analytics = () => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  // 🔥 AI Generated Mood + Sentiment Summary
  const dominantMood = "Calm";
  const constantMood = "Stable & Emotionally Balanced";

  const aiInsights = [
    "Your stress levels drop significantly after morning meditation sessions.",
    "You tend to feel most happy on weekends — consider scheduling creative activities mid-week.",
    "Voice tone analysis shows improved emotional regulation over the past 2 weeks.",
  ];

  const buildReportPayload = () => {
    return {
      generatedAt: new Date().toISOString(),
      stats: analyticsStats,
      dominantState: {
        label: dominantMood,
        details: ["Maintained 4 days", "Focused & Consistent"],
      },
      constantMood,
      insights: aiInsights,
    };
  };

 const [loading, setLoading] = useState(false);

const generateReportAndQR = async () => {
  if (loading) return; // prevent multiple clicks

  setLoading(true);

  try {
    const report = buildReportPayload();

    const response = await fetch("http://192.168.0.151:8000/public/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report,
        coupon: "TAKECARE20",
        createdAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (data?.url) {
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.url)}`;

      setReportUrl(data.url);
      setQrImage(qr);
      setShowQr(true);
    }
  } catch (error) {
    console.error("QR generation error:", error);
  } finally {
    setLoading(false);
  }
};

  const downloadPdfDirectly = async () => {
    if (!reportUrl) return;

    const response = await fetch(reportUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "AURA-Mental-Health-Report.pdf";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const simulateScanUnlock = () => {
    setUnlocked(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full"
    >
      <div>
        <h1 className="text-2xl font-bold gradient-cyan-lavender mb-1">
          Analytics
        </h1>
        <p className="text-sm text-caption">
          Deep dive into your emotional patterns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsStats.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

      {/* Timeline + Emotion Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MoodTimeline />
        <EmotionPanel />
      </div>

      {/* AI Insights */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          AI Insights
        </h3>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground">
            Dominant Mood:
            <span className="ml-2 font-semibold text-foreground">
              {dominantMood}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Constant Mood Pattern:
            <span className="ml-2 font-semibold text-foreground">
              {constantMood}
            </span>
          </p>
        </div>

        <div className="space-y-3">
          {aiInsights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* REPORT SECTION */}
      <div className="glass rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Generate AI Mental Health Report
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Includes emotional summary + SPA unlock coupon
          </p>
        </div>

        <div className="flex gap-3">
         <button
  onClick={generateReportAndQR}
  disabled={loading}
  className="px-4 py-2 bg-cyan text-primary-foreground rounded-lg disabled:opacity-50"
>
  {loading ? "Generating..." : "Generate & Show QR"}
</button>

          {reportUrl && (
            <button
              onClick={downloadPdfDirectly}
              className="px-4 py-2 border rounded-lg"
            >
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {showQr && qrImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card p-6 rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold">
              Scan QR to Download Report
            </h3>

            <img
              src={qrImage}
              alt="Report QR"
              className="w-64 h-64 object-contain"
            />

            {!unlocked ? (
              <button
                onClick={simulateScanUnlock}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Simulate Scan
              </button>
            ) : (
              <div className="text-center">
                <div className="font-semibold text-lg">
                  🎉 Coupon Unlocked!
                </div>
                <div className="text-sm text-muted-foreground">
                  SPA Code: TAKECARE20
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.open(reportUrl || "", "_blank")}
                className="px-4 py-2 bg-cyan text-primary-foreground rounded-lg"
              >
                Open PDF
              </button>

              <button
                onClick={() => setShowQr(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Analytics;