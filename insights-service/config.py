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
    SWAGGER = {
        "title": "FloodLink insights-service API",
        "uiversion": 3,
        "securityDefinitions": {
            "Bearer": {"type": "apiKey", "name": "Authorization", "in": "header",
                       "description": "Type: Bearer <your JWT>"},
        },
    }
