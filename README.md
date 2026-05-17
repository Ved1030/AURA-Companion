# AURA Companion
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/Ved1030/AURA-Companion)

AURA is an emotionally intelligent AI wellness companion designed to provide a supportive and interactive experience for mental well-being. It leverages a multimodal approach, analyzing facial expressions, voice tonality, and text input to understand the user's emotional state in real-time. Based on this analysis, AURA offers personalized conversations, guided activities, and data-driven insights to foster emotional clarity and resilience.

The application features an interactive 3D avatar that engages users in conversation, a gamified wellness journey, a suite of mood-boosting mini-games, and a comprehensive analytics dashboard.

## Core Features

*   **Multimodal Emotion Detection**: Real-time analysis of user emotions through facial expressions (via webcam), voice tone (via microphone), and text sentiment.
*   **Conversational AI Companion**: Engage with different AI avatars, each with a unique personality (e.g., Calm, Joy, Zen). The AI's responses are dynamically tailored to the user's detected emotional state.
*   **Interactive 3D Avatar**: A lifelike 3D avatar with real-time lip-sync for generated audio responses, creating a more personal and engaging interaction.
*   **Personalized Wellness Journey**: A gamified "Odyssey" where users progress through chapters and milestones by engaging with the app, promoting consistent self-care.
*   **Analytics Dashboard**: A comprehensive dashboard visualizing mood trends, emotional patterns, session history, and AI-driven insights. It includes a feature to generate and download a PDF wellness report.
*   **Wellness Games**: A collection of interactive mini-games designed for relaxation and mood improvement, including breathing exercises, memory challenges, and gratitude practices.
*   **Therapist Marketplace**: An in-app portal to browse and book sessions with licensed therapists.

## Technology Stack

### Frontend

*   **Framework**: React (with Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS with Shadcn/ui component library
*   **3D Rendering**: React Three Fiber (`@react-three/fiber`) & Drei
*   **State Management**: React Context, `useState`
*   **Animations**: Framer Motion
*   **Authentication & Database**: Firebase (Auth, Firestore)
*   **Routing**: React Router

### Backend

*   **Framework**: Python with FastAPI
*   **AI & Machine Learning**:
    *   **Facial Emotion Recognition**: TensorFlow/Keras with a custom CNN model.
    *   **Text/Voice Emotion Analysis**: Hugging Face Transformers (`j-hartmann/emotion-english-distilroberta-base`).
    *   **Image Processing**: OpenCV.
*   **AI Services**:
    *   **Language Model (LLM)**: Groq API (`llama-3.1-8b-instant`).
    *   **Text-to-Speech (TTS) & Speech-to-Text (STT)**: Sarvam AI.
*   **PDF Generation**: ReportLab
*   **Asynchronous Server**: Uvicorn

## Architecture

AURA operates on a client-server architecture:

*   The **frontend** is a React single-page application (SPA) responsible for rendering the UI, capturing user inputs (camera, microphone, text), and managing user sessions. It uses Firebase for user authentication and to store persistent data like journey progress.
*   The **backend** is a Python service built with FastAPI that exposes several RESTful API endpoints. It handles all the heavy AI processing, including emotion detection from various inputs, conversation management, and interaction with third-party AI services (Groq, Sarvam).

### Flow of Interaction

1.  A user interacts with the frontend.
2.  The frontend captures an input (e.g., a webcam image, a voice recording, or a text message).
3.  An API request is sent to the appropriate backend endpoint (`/emotion`, `/voice-emotion`, or `/assistant`).
4.  The backend processes the input, determines the user's emotional state, and formulates a context-aware prompt.
5.  The prompt is sent to the Groq API to generate a text response from the LLM.
6.  The LLM's response is converted to speech using the Sarvam AI TTS service.
7.  The backend returns the text and base64-encoded audio to the frontend.
8.  The frontend displays the text response and plays the audio, triggering the 3D avatar's lip-sync animation.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or later)
*   Python (v3.9 or later)
*   `pip` and `venv`

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory and add your API keys:
    ```env
    GROQ_API_KEY="YOUR_GROQ_API_KEY"
    SARVAM_API_KEY="YOUR_SARVAM_AI_API_KEY"
    ```

5.  **Run the backend server:**
    The server will run on `http://127.0.0.1:8000`.
    ```bash
    uvicorn main:app --reload
    ```
    You may need to update the IP address in `backend/main.py` for the public report system to match your local network IP.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install npm dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    Open `frontend/src/firebase.ts` and replace the placeholder `firebaseConfig` object with your own Firebase project credentials.

4.  **Run the frontend development server:**
    The application will be accessible at `http://localhost:8080`.
    ```bash
    npm run dev
    ```

## Project Structure

The repository is organized into two main parts: `frontend` and `backend`.

```
├── backend/
│   ├── main.py             # FastAPI application entrypoint with API endpoints.
│   ├── realtimedetection.py  # Standalone script for real-time camera detection.
│   ├── requirements.txt    # Python dependencies.
│   ├── models/             # Pre-trained Keras model for facial emotion recognition.
│   └── services/           # Backend logic for assistant, memory, etc.
│       ├── assistant.py    # Core logic for processing conversations.
│       └── memory.py       # Manages conversation history per session.
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable React components.
    │   │   ├── avatar/     # Components for the 3D avatar and lip-sync.
    │   │   ├── journey/    # Components related to the wellness journey UI.
    │   │   └── ui/         # Base UI components (Shadcn/ui).
    │   ├── context/        # React context providers (e.g., AuthContext).
    │   ├── hooks/          # Custom React hooks.
    │   ├── pages/          # Top-level page components for each route.
    │   │   └── games/      # Components for each wellness mini-game.
    │   ├── App.tsx         # Main application component with routing.
    │   └── firebase.ts     # Firebase initialization and configuration.
    ├── vite.config.ts      # Vite build and development server configuration.
    └── tailwind.config.ts  # Tailwind CSS theme and plugin configuration.
```

## API Endpoints

The backend provides the following key API endpoints:

| Method | Endpoint                    | Description                                                              |
| :----- | :-------------------------- | :----------------------------------------------------------------------- |
| `POST` | `/assistant`                | Main conversational endpoint. Accepts text or audio `FormData`.          |
| `POST` | `/emotion`                  | Analyzes a base64 encoded image for facial emotion.                      |
| `POST` | `/text-emotion`             | Analyzes a string of text to determine its emotional content.            |
| `POST` | `/voice-emotion`            | Transcribes an audio file and analyzes the resulting text for emotion.   |
| `POST` | `/public/report`            | Creates a public, shareable link for a generated wellness report.        |
| `GET`  | `/public/report/{token}/pdf`| Serves the generated wellness report as a downloadable PDF file.         |
