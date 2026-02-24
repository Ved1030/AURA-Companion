import { useRef, useEffect } from "react";

export default function useLipSync(scene) {
  const meshRef = useRef(null);
  const visemeIndexesRef = useRef([]);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);

  // 🔥 Initialize AFTER scene is ready
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child.morphTargetDictionary) {
        meshRef.current = child;

        const dict = child.morphTargetDictionary;
        console.log("FOUND morph targets:", dict);

        const visemes = Object.keys(dict)
          .filter((key) => key.toLowerCase().includes("viseme"))
          .map((key) => dict[key]);

        visemeIndexesRef.current = visemes;

        console.log("Viseme indexes:", visemes);
      }
    });
  }, [scene]);

  const playAudioWithLipSync = async (audioBlob) => {
    if (!meshRef.current || !visemeIndexesRef.current.length) {
      console.log("Morph targets not ready yet.");
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    if (!audioContextRef.current) {
      audioContextRef.current =
        new (window.AudioContext || window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    await audioContext.resume();

    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      const volume =
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      const strength = Math.min(volume / 30, 1);

      visemeIndexesRef.current.forEach((index) => {
        const current =
          meshRef.current.morphTargetInfluences[index];

        meshRef.current.morphTargetInfluences[index] =
          current + (strength - current) * 0.4;
      });

      if (!audio.paused) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    audio.onplay = () => animate();

    audio.onended = () => {
      visemeIndexesRef.current.forEach((index) => {
        meshRef.current.morphTargetInfluences[index] = 0;
      });

      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      analyser.disconnect();
    };

    await audio.play();
  };

  return { playAudioWithLipSync };
}