import cv2
import numpy as np
from tensorflow.keras.models import model_from_json
from collections import deque

# -------------------- LOAD MODEL --------------------

with open("models/facialemotionmodel.json", "r") as json_file:
    model_json = json_file.read()

model = model_from_json(model_json)
model.load_weights("models/facialemotionmodel.h5")

print("Model Loaded Successfully!")

# -------------------- FACE DETECTION --------------------

haar_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(haar_file)

# -------------------- LABELS --------------------

labels = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "neutral",
    5: "sad",
    6: "surprise",
}

# -------------------- TRACKING MEMORY --------------------

emotion_history = deque(maxlen=5)   # last 5 frames
stress_score = 0                    # dynamic stress engine

# -------------------- FEATURE EXTRACTION --------------------

def extract_features(image):
    image = np.array(image)
    image = image.reshape(1, 48, 48, 1)
    return image / 255.0


def calculate_stress(pred_probs):
    """
    Stress is combination of negative emotions
    """
    angry = pred_probs[0]
    fear = pred_probs[2]
    sad = pred_probs[5]
    disgust = pred_probs[1]

    stress = (angry + fear + sad + disgust) * 100
    return int(stress)


def get_stable_emotion():
    """
    Emotion must repeat 3 times in last 5 frames
    """
    if len(emotion_history) < 5:
        return None

    for emotion in set(emotion_history):
        if emotion_history.count(emotion) >= 3:
            return emotion

    return None


def decide_avatar_mode(confidence, stable_emotion, stress):
    if confidence < 55:
        return "check_in"

    if stress > 80:
        return "crisis"

    if stress > 60:
        return "support"

    if stable_emotion in ["sad", "fear", "angry"]:
        return "empathy"

    if stable_emotion == "happy":
        return "celebrate"

    return "neutral"


# -------------------- START WEBCAM --------------------

webcam = cv2.VideoCapture(0)

while True:
    ret, frame = webcam.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (48, 48))

        img = extract_features(face)
        prediction = model.predict(img, verbose=0)[0]

        dominant_index = np.argmax(prediction)
        dominant_emotion = labels[dominant_index]
        confidence = prediction[dominant_index] * 100

        # Update history
        emotion_history.append(dominant_emotion)

        # Calculate stress
        stress_score = calculate_stress(prediction)

        # Get stable emotion
        stable_emotion = get_stable_emotion()

        # Decide final state
        avatar_mode = decide_avatar_mode(
            confidence,
            stable_emotion,
            stress_score
        )

        # ---------------- DISPLAY ----------------

        text = f"{dominant_emotion} | {int(confidence)}% | Stress:{stress_score}"

        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        cv2.putText(frame, text, (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 0, 255), 2)

        # DEBUG PRINT
        print({
            "emotion": dominant_emotion,
            "confidence": round(confidence, 2),
            "stress": stress_score,
            "stable_emotion": stable_emotion,
            "avatar_mode": avatar_mode
        })

    cv2.imshow("AURA Emotion Engine", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

webcam.release()
cv2.destroyAllWindows()