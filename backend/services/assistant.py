import requests
import os
import io
from dotenv import load_dotenv
from sarvamai import SarvamAI
from services.memory import get_memory

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

# -------------------- AVATAR CONFIG --------------------

AVATAR_CONFIG = {
    "Calm Aura": {
        "llm_model": "llama-3.1-8b-instant",
        "tts_model": "bulbul:v2",
        "speaker": "anushka"
    },
    "Joy Aura": {
        "llm_model": "llama-3.1-8b-instant",
        "tts_model": "bulbul:v2",
        "speaker": "abhilash"
    },
    "Zen Aura": {
        "llm_model": "llama-3.1-8b-instant",
        "tts_model": "bulbul:v2",
        "speaker": "manisha"
    }
}

# -------------------- SYSTEM PROMPT --------------------

def build_system_prompt(emotion: str, avatar_name: str):
    emotion = (emotion or "neutral").lower()

    return f"""
You are {avatar_name}, an emotionally intelligent AI wellness companion.

The user's facial emotion detected from the camera is: {emotion}.

IMPORTANT RULES:
- Start the conversation naturally based on this emotion.
- Do NOT say you are an AI model.
- Be warm, human-like, and caring.
- Keep responses short (2–4 sentences max).
"""


# -------------------- LLM CALL --------------------

def generate_ai_response(user_text, emotion, memory, avatar_name):

    avatar_config = AVATAR_CONFIG.get(avatar_name, AVATAR_CONFIG["Calm Aura"])
    llm_model = avatar_config["llm_model"]

    system_prompt = build_system_prompt(emotion, avatar_name)

    memory.append({
        "role": "user",
        "content": user_text
    })

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                *memory
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }
    )

    if response.status_code != 200:
        raise Exception(f"Groq API Error: {response.text}")

    data = response.json()
    reply = data["choices"][0]["message"]["content"]

    memory.append({
        "role": "assistant",
        "content": reply
    })

    return reply


# -------------------- MAIN PROCESS FUNCTION --------------------

async def process_assistant(request, audio):

    user_text = None
    emotion = "neutral"
    session_id = "default"
    avatar_name = "Calm Aura"

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
        session_id = form_data.get("session_id", "default")
        avatar_name = form_data.get("avatar_name", "Calm Aura")

    # -------------------- TEXT INPUT --------------------
    else:
        body = await request.json()
        user_text = body.get("text")
        emotion = body.get("emotion", "neutral")
        session_id = body.get("session_id", "default")
        avatar_name = body.get("avatar_name", "Calm Aura")

    if not user_text:
        return {"error": "No input provided"}

    print("Avatar:", avatar_name)
    print("Emotion:", emotion)
    print("Session:", session_id)

    memory = get_memory(session_id)

    # -------------------- GENERATE RESPONSE --------------------
    ai_reply = generate_ai_response(user_text, emotion, memory, avatar_name)

    # -------------------- TEXT TO SPEECH --------------------
    try:
        avatar_config = AVATAR_CONFIG.get(avatar_name, AVATAR_CONFIG["Calm Aura"])

        tts_response = sarvam_client.text_to_speech.convert(
            target_language_code="en-IN",
            text=ai_reply,
            model=avatar_config["tts_model"],
            speaker=avatar_config["speaker"]
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