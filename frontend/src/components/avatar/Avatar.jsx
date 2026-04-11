import React, { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import useLipSync from "./useLipSync";

export default function Avatar({ onReady, modelUrl }) {
  const group = useRef();

  const { scene } = useGLTF(
    modelUrl ||
      "/assets/avatar/model.glb"
  );

  const lipSync = useLipSync(scene);

  // 🔥 Wait until scene loads properly
  useEffect(() => {
    if (scene && lipSync && onReady) {
      console.log("Avatar loaded, sending lipSync controller");
      onReady(lipSync);
    }
  }, [scene]);

  return (
    <group
      ref={group}
      position={[-0.10, -2.5, 0]}   // centered
      rotation={[0, -0.0, 0]}      // straight
    >
      <primitive object={scene} scale={1.6} />
    </group>
  );
}