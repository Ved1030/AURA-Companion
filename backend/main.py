from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from services.assistant import process_assistant

import cv2
import numpy as np
import base64
from tensorflow.keras.models import model_from_json
from collections import deque
import uuid
import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# 🔥 NEW (for session memory)
from services.memory import get_memory

# 🔥 NEW (for text & voice emotion)
from transformers import pipeline
import speech_recognition as sr
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
public_reports = {}

text_emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None
)

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

def extract_features(image):
    image = np.array(image)
    image = image.reshape(1, 48, 48, 1)
    return image / 255.0

def calculate_stress(pred_probs):
    return int((pred_probs[0] + pred_probs[2] + pred_probs[5] + pred_probs[1]) * 100)

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

@app.post("/assistant")
async def assistant_endpoint(request: Request, audio: UploadFile = File(None)):
    return await process_assistant(request, audio)

@app.post("/emotion")
async def emotion_endpoint(request: Request):
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

from pydantic import BaseModel

class TextInput(BaseModel):
    text: str

@app.post("/text-emotion")
async def text_emotion_endpoint(data: TextInput):
    prediction = text_emotion_model(data.text)[0]
    top_emotion = max(prediction, key=lambda x: x['score'])
    confidence = float(top_emotion["score"] * 100)

    return {
        "emotion": top_emotion["label"],
        "confidence": round(confidence, 2)
    }

@app.post("/voice-emotion")
async def voice_emotion_endpoint(audio: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        wav_path = tmp_path.replace(".webm", ".wav")
        os.system(f"ffmpeg -i {tmp_path} {wav_path} -y")

        recognizer = sr.Recognizer()
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

# ---------------- PUBLIC REPORT SYSTEM ----------------

@app.post("/public/report")
async def create_public_report(request: Request):
    body = await request.json()

    token = uuid.uuid4().hex
    public_reports[token] = body

    # 🔥 IMPORTANT: Use your laptop IP
    base = "http://192.168.0.151:8000"
    download_url = f"{base}/public/report/{token}/pdf"

    return {
        "token": token,
        "url": download_url

    }

@app.get("/public/report/{token}/pdf")
async def serve_report_pdf(token: str):
    payload = public_reports.get(token)
    if not payload:
        return {"error": "Report not found"}

    report = payload.get("report", {})
    coupon = payload.get("coupon", "TAKECARE20")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 22)
    c.drawString(72, height - 72, "AURA Mental Wellness Report")

    c.setFont("Helvetica", 11)
    c.drawString(72, height - 100, f"Generated: {payload.get('createdAt', '')}")

    y = height - 140

    dominant = report.get("dominantState", {})
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, y, f"Dominant State: {dominant.get('label', 'N/A')}")
    y -= 20

    c.setFont("Helvetica", 11)
    for detail in dominant.get("details", []):
        c.drawString(90, y, f"- {detail}")
        y -= 15

    y -= 20
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, "Insights:")
    y -= 20

    c.setFont("Helvetica", 11)
    for insight in report.get("insights", [])[:6]:
        c.drawString(90, y, f"- {insight}")
        y -= 15

    y -= 30
    c.setFillColorRGB(0.95, 0.85, 0.78)
    c.rect(72, y - 40, 400, 50, fill=1)

    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(90, y - 15, "🎉 SPA UNLOCKED 🎉")

    c.setFont("Helvetica-Bold", 20)
    c.drawString(90, y - 35, f"Coupon Code: {coupon}")

    c.showPage()
    c.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=aura-report-{token}.pdf"
        }
    )