# Settings for insights-service, read once when app.py creates the Flask app.
# Values come from the .env file (via python-dotenv) or environment variables, with safe defaults.
import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", "5001"))
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///analysis.db")
    # Turned off because we don't use SQLAlchemy's change-tracking events and it wastes memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Same secret as auth-realtime-service (which signs tokens); we only verify
    JWT_SECRET = os.getenv("JWT_SECRET", "floodlink-demo-secret-change-me-0123456789")
    REQUEST_SERVICE_URL = os.getenv("REQUEST_SERVICE_URL", "http://localhost:8080")
    # The React app runs on another port, so the browser needs explicit (CORS) permission to call us
    CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    # Local LLM (Ollama) that reads every help request and decides its priority. Nothing is scored without it.
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    # Empty = auto-detect: the first installed Qwen model, else the first chat model (see services/llm_client.py)
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "").strip()
    # A local 7B model on CPU can need a while; request-service waits this long too (INSIGHTS_READ_TIMEOUT_MS)
    OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "45"))
    # How long Ollama keeps the model in memory after a call, so the next request doesn't pay the load time
    OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")
    SWAGGER = {
        "title": "FloodLink insights-service API",
        "uiversion": 3,
        "securityDefinitions": {
            "Bearer": {"type": "apiKey", "name": "Authorization", "in": "header",
                       "description": "Type: Bearer <your JWT>"},
        },
    }
