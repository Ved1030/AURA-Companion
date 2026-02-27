from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from services.assistant import process_assistant

import cv2
import numpy as np
import base64
from tensorflow.keras.models import model_from_json
from collections import deque

# 🔥 NEW (for session memory)
from services.memory import get_memory

# 🔥 NEW (for text & voice emotion)
from transformers import pipeline
import speech_recognition as sr
import tempfile
import os

app = FastAPI()

# -------------------- CORS --------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- GLOBALS --------------------

model = None
face_cascade = None

labels = {
    0: "angry",
    1: "disgust",
    2: "fear",
    3: "happy",
    4: "neutral",
    5: "sad",
    6: "surprise",
}

emotion_history = deque(maxlen=5)

# 🔥 NEW: Load NLP emotion model once
text_emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None
)

# -------------------- STARTUP EVENTS --------------------

@app.on_event("startup")
def load_emotion_model():
    global model, face_cascade

    with open("models/facialemotionmodel.json", "r") as json_file:
        model_json = json_file.read()

    model = model_from_json(model_json)
    model.load_weights("models/facialemotionmodel.h5")

    haar_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(haar_file)

    print("Emotion Model Loaded Successfully!")

# -------------------- HELPER FUNCTIONS --------------------

def extract_features(image):
    image = np.array(image)
    image = image.reshape(1, 48, 48, 1)
    return image / 255.0


def calculate_stress(pred_probs):
    angry = pred_probs[0]
    fear = pred_probs[2]
    sad = pred_probs[5]
    disgust = pred_probs[1]
    stress = (angry + fear + sad + disgust) * 100
    return int(stress)


def get_stable_emotion():
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

# -------------------- ASSISTANT ENDPOINT --------------------

@app.post("/assistant")
async def assistant_endpoint(request: Request, audio: UploadFile = File(None)):
    return await process_assistant(request, audio)

# -------------------- FACE EMOTION ENDPOINT --------------------

@app.post("/emotion")
async def emotion_endpoint(request: Request):
    global model

    body = await request.json()
    image_base64 = body.get("image")

    if not image_base64:
        return {"error": "No image provided"}

    img_data = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    results = []

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (48, 48))

        img = extract_features(face)
        prediction = model.predict(img, verbose=0)[0]

        dominant_index = np.argmax(prediction)
        dominant_emotion = labels[dominant_index]
        confidence = float(prediction[dominant_index] * 100)

        emotion_history.append(dominant_emotion)

        stress_score = calculate_stress(prediction)
        stable_emotion = get_stable_emotion()

        avatar_mode = decide_avatar_mode(
            confidence,
            stable_emotion,
            stress_score
        )

        results.append({
            "emotion": dominant_emotion,
            "confidence": round(confidence, 2),
            "stress": stress_score,
            "stable_emotion": stable_emotion,
            "avatar_mode": avatar_mode
        })

    if not results:
        return {"message": "No face detected"}

    return {"results": results}

# -------------------- TEXT EMOTION ENDPOINT --------------------
from pydantic import BaseModel

class TextInput(BaseModel):
    text: str
@app.post("/text-emotion")
async def text_emotion_endpoint(data: TextInput):

    if not data.text:
        return {"error": "No text provided"}

    prediction = text_emotion_model(data.text)[0]
    top_emotion = max(prediction, key=lambda x: x['score'])

    confidence = float(top_emotion["score"] * 100)

    return {
        "emotion": top_emotion["label"],
        "confidence": round(confidence, 2)
    }

# -------------------- VOICE EMOTION ENDPOINT --------------------

@app.post("/voice-emotion")
async def voice_emotion_endpoint(audio: UploadFile = File(...)):
    try:
        # Save temp file as webm
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        recognizer = sr.Recognizer()

        # Convert webm → wav using ffmpeg (required)
        wav_path = tmp_path.replace(".webm", ".wav")

        os.system(f"ffmpeg -i {tmp_path} {wav_path} -y")

        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        text = recognizer.recognize_google(audio_data)

        os.remove(tmp_path)
        os.remove(wav_path)

        prediction = text_emotion_model(text)[0]
        top_emotion = max(prediction, key=lambda x: x['score'])

        confidence = float(top_emotion["score"] * 100)

        return {
            "transcribed_text": text,
            "emotion": top_emotion["label"],
            "confidence": round(confidence, 2)
        }

    except Exception as e:
        return {"error": str(e)}