# backend/services/emotion.py

from deepface import DeepFace
import base64
import numpy as np
import cv2

print("🔥 Initializing DeepFace model...")

# Warm-up model once to remove first-call delay
dummy = np.zeros((224, 224, 3), dtype=np.uint8)
DeepFace.analyze(
    dummy,
    actions=["emotion"],
    detector_backend="opencv",
    enforce_detection=False
)

print("✅ DeepFace Ready")


def detect_emotion(base64_image: str):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(base64_image.split(",")[1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Image decoding failed"}

        # Resize for faster inference
        img = cv2.resize(img, (224, 224))

        # Run DeepFace
        result = DeepFace.analyze(
            img,
            actions=["emotion"],
            detector_backend="opencv",
            enforce_detection=False
        )

        # Sometimes DeepFace returns list
        if isinstance(result, list):
            result = result[0]

        dominant = result["dominant_emotion"]

        # Convert numpy float32 → normal float
        clean_emotions = {
            key: float(value)
            for key, value in result["emotion"].items()
        }

        confidence = float(clean_emotions[dominant])

        return {
            "dominant_emotion": dominant,
            "confidence": confidence,
            "all_emotions": clean_emotions
        }

    except Exception as e:
        return {"error": str(e)}