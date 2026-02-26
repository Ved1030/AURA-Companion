import requests
import os
import io
from dotenv import load_dotenv
from sarvamai import SarvamAI

load_dotenv(dotenv_path=".env", override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)


# -------------------- STRONG EMOTION-AWARE SYSTEM PROMPT --------------------

def build_system_prompt(emotion: str):
    emotion = (emotion or "neutral").lower()

    return f"""
You are AURA, an emotionally intelligent AI wellness companion.

The user's facial emotion detected from the camera is: {emotion}.

IMPORTANT RULES:
- Start the conversation naturally based on this emotion.
- Do NOT say you are an AI model.
- Do NOT say you don't have emotions.
- Be warm, human-like, and caring.
- Keep responses short and conversational (2–4 sentences max).

Emotion Handling Guide:
- sad → Be empathetic and supportive.
- happy → Be energetic and celebrate.
- angry → Be calming and de-escalate.
- fear → Reassure and provide comfort.
- surprise → Be curious and engaging.
- disgust → Be understanding and gentle.
- neutral → Gently check in and ask how they feel.

Always respond like you are directly talking to the user.
"""


# -------------------- LLM CALL --------------------

def generate_ai_response(user_text, emotion=None):
    system_prompt = build_system_prompt(emotion)

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_text
                }
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }
    )

    if response.status_code != 200:
        raise Exception(f"Groq API Error: {response.text}")

    data = response.json()
    return data["choices"][0]["message"]["content"]


# -------------------- MAIN PROCESS FUNCTION --------------------

async def process_assistant(request, audio):

    user_text = None
    emotion = "neutral"

    # -------------------- VOICE INPUT --------------------
    if audio:
        audio_bytes = await audio.read()
        audio_file = io.BytesIO(audio_bytes)

        stt_response = sarvam_client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v3",
            mode="transcribe"
        )

        user_text = stt_response.transcript

        form_data = await request.form()
        emotion = form_data.get("emotion", "neutral")

    # -------------------- TEXT INPUT --------------------
    else:
        body = await request.json()
        user_text = body.get("text")
        emotion = body.get("emotion", "neutral")

    if not user_text:
        return {"error": "No input provided"}

    print("Emotion received:", emotion)

    # -------------------- GENERATE RESPONSE --------------------
    ai_reply = generate_ai_response(user_text, emotion)

    # -------------------- TEXT TO SPEECH --------------------
    try:
        tts_response = sarvam_client.text_to_speech.convert(
            target_language_code="en-IN",
            text=ai_reply,
            model="bulbul:v3",
            speaker="ishita"
        )

        audio_base64 = tts_response.audios[0]

    except Exception as e:
        print("TTS Error:", str(e))
        audio_base64 = None

    return {
        "emotion_detected": emotion,
        "user_text": user_text,
        "reply": ai_reply,
        "audio": audio_base64
    }