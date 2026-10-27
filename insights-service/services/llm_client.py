# Thin client for a local Ollama server (https://ollama.com). It is the ONLY place that talks to the model.
# chat_json() sends a prompt and gets back a JSON object that matches the schema we ask for.
# Every failure (Ollama off, model missing, too slow, answer that is not valid JSON) becomes one LlmError,
# so routes can answer "503, model unavailable" in one place instead of handling a dozen different exceptions.
import json
import logging
import threading

import requests

from config import Config

logger = logging.getLogger(__name__)


class LlmError(Exception):
    """The local model could not give a usable answer."""


_model_lock = threading.Lock()
_resolved_model = None


def _base_url():
    return Config.OLLAMA_URL.rstrip("/")


def list_models():
    """Names of the models installed in Ollama (same list as `ollama list`)."""
    try:
        response = requests.get(f"{_base_url()}/api/tags", timeout=5)
        response.raise_for_status()
        return [model["name"] for model in response.json().get("models", [])]
    except (requests.RequestException, ValueError, KeyError) as error:
        raise LlmError(f"Cannot reach Ollama at {_base_url()}: {error}") from error


def resolve_model():
    """OLLAMA_MODEL from .env if set. Otherwise the first installed Qwen model, otherwise the first chat model.
    Looked up once and remembered, so the .env file is only needed to pin a specific model."""
    global _resolved_model
    if Config.OLLAMA_MODEL:
        return Config.OLLAMA_MODEL
    with _model_lock:
        if _resolved_model is None:
            names = [name for name in list_models() if "embed" not in name.lower()]
            if not names:
                raise LlmError("Ollama has no chat model installed. Run e.g. `ollama pull qwen2.5:7b`")
            qwen = [name for name in names if name.lower().startswith("qwen")]
            _resolved_model = (qwen or names)[0]
            logger.info("OLLAMA_MODEL not set, using %s (installed: %s)", _resolved_model, ", ".join(names))
        return _resolved_model


def reset_model_cache():
    """Used by tests (and handy after `ollama pull`) to forget the auto-detected model."""
    global _resolved_model
    with _model_lock:
        _resolved_model = None


def chat_json(system_prompt, user_prompt, schema):
    """Asks the model and returns the parsed JSON object. "format": schema makes Ollama constrain the output
    to that JSON schema. Temperature 0 and a fixed seed keep the same request giving the same answer."""
    payload = {
        "model": resolve_model(),
        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        "format": schema,
        "stream": False,
        # Qwen3-style models "think" first, which is slow and not needed here (ignored by other models)
        "think": False,
        "keep_alive": Config.OLLAMA_KEEP_ALIVE,
        "options": {"temperature": 0, "seed": 7, "num_predict": 700},
    }
    try:
        response = requests.post(f"{_base_url()}/api/chat", json=payload, timeout=Config.OLLAMA_TIMEOUT_SECONDS)
        if response.status_code == 400 and "think" in response.text.lower():
            # Some Ollama versions refuse the "think" option for models that cannot think: retry without it
            payload.pop("think")
            response = requests.post(f"{_base_url()}/api/chat", json=payload, timeout=Config.OLLAMA_TIMEOUT_SECONDS)
        response.raise_for_status()
        content = response.json()["message"]["content"]
        result = json.loads(content)
    except requests.Timeout as error:
        raise LlmError(f"Ollama took longer than {Config.OLLAMA_TIMEOUT_SECONDS}s to answer") from error
    except requests.RequestException as error:
        raise LlmError(f"Ollama request failed: {error}") from error
    except (ValueError, KeyError, TypeError) as error:
        raise LlmError(f"Ollama answered with something that is not the expected JSON: {error}") from error
    if not isinstance(result, dict):
        raise LlmError("Ollama answered with JSON that is not an object")
    return result
