import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import EmotionPanel from "./EmotionPanel";

const EmotionDetector = () => {
  const webcamRef = useRef<Webcam>(null);

  const [dominantEmotion, setDominantEmotion] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [allEmotions, setAllEmotions] = useState<Record<string, number> | null>(null);
  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    const response = await fetch("http://localhost:8000/emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageSrc }),
    });

    const data = await response.json();

    if (!data.error) {
      setDominantEmotion(data.dominant_emotion);
      setConfidence(data.confidence);
      setAllEmotions(data.all_emotions);
    }
  };

  // ✅ ADD IT HERE
  useEffect(() => {
    const interval = setInterval(() => {
      capture();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={300}
      />

      <button onClick={capture}>
        Detect Emotion
      </button>

      {dominantEmotion && (
        <div>
          <h2>Dominant: {dominantEmotion}</h2>
          <p>Confidence: {confidence?.toFixed(2)}%</p>
        </div>
      )}

      {allEmotions && <EmotionPanel emotions={allEmotions} />}
    </div>
  );
};

export default EmotionDetector;