import { useState, useEffect } from "react";
import Scene from "./avatar/Scene";

interface Props {
  audioBlob: Blob | null;
}

export default function AIVatar({ audioBlob }: Props) {
  const [lipSync, setLipSync] = useState<any>(null);

  useEffect(() => {
    if (audioBlob && lipSync) {
      lipSync.playAudioWithLipSync(audioBlob);
    }
  }, [audioBlob, lipSync]);

  return (
    <div className="w-72 h-72 rounded-full overflow-hidden border border-cyan-400 shadow-2xl">
      <Scene onAvatarReady={setLipSync} />
    </div>
  );
}