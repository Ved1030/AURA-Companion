from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from services.assistant import process_assistant
from services.emotion import detect_emotion

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Assistant Endpoint
# ---------------------------
@app.post("/assistant")
async def assistant_endpoint(request: Request, audio: UploadFile = File(None)):
    return await process_assistant(request, audio)


# ---------------------------
# Emotion Endpoint
# ---------------------------
@app.post("/emotion")
async def emotion_endpoint(request: Request):
    body = await request.json()
    image = body.get("image")

    if not image:
        return {"error": "No image provided"}

    result = detect_emotion(image)

    return result