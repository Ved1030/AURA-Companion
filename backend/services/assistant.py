import requests
import os
import io
from dotenv import load_dotenv
from sarvamai import SarvamAI

from dotenv import load_dotenv
load_dotenv(dotenv_path=".env", override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

def generate_ai_response(user_text):
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
                    "content": "You are a friendly voice assistant. Keep answers short and conversational."
                },
                {
                    "role": "user",
                    "content": user_text
                }
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }
    )

    if response.status_code != 200:
        raise Exception(f"Groq API Error: {response.text}")

    data = response.json()
    return data["choices"][0]["message"]["content"]


async def process_assistant(request, audio):
    user_text = None

    # Voice input
    if audio:
        audio_bytes = await audio.read()
        audio_file = io.BytesIO(audio_bytes)

        stt_response = sarvam_client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v3",
            mode="transcribe"
        )

        user_text = stt_response.transcript

    # Text input
    else:
        body = await request.json()
        user_text = body.get("text")

    if not user_text:
        return {"error": "No input provided"}

    ai_reply = generate_ai_response(user_text)

    try:
        tts_response = sarvam_client.text_to_speech.convert(
            target_language_code="en-IN",
            text=ai_reply,
            model="bulbul:v3",
            speaker="shubh"
        )
        audio_base64 = tts_response.audios[0]

    except Exception as e:
        print("TTS Error:", str(e))
        audio_base64 = None

    return {
        "user_text": user_text,
        "reply": ai_reply,
        "audio": audio_base64
    }