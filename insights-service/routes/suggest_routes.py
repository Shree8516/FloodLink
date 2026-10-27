# POST /api/v1/suggest: live suggestions for the React "Ask for help" form while the citizen types
# (suggested type, urgency and a priority preview), all judged by the local LLM. Nothing is saved: it's a preview.
from flask import Blueprint, jsonify, request

from auth import require_jwt
from errors import ApiError
from services.stats_service import REQUEST_TYPES
from services.suggest_service import build_suggestion

suggest_bp = Blueprint("suggest", __name__)

MAX_DESCRIPTION_LENGTH = 500


def parse_people_count(value):
    """Optional; the form may still be empty, so anything missing counts as 1 person."""
    if value in (None, ""):
        return 1
    try:
        people = int(value)
    except (TypeError, ValueError):
        raise ApiError(400, "peopleCount must be a whole number")
    if not 1 <= people <= 1000:
        raise ApiError(400, "peopleCount must be between 1 and 1000")
    return people


@suggest_bp.post("/api/v1/suggest")
@require_jwt()
def suggest():
    """Suggest a request type and urgency from a description, with a live priority preview.
    ---
    tags: [Suggestions]
    security: [{Bearer: []}]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          example: {description: "Elderly couple trapped on first floor, water rising", type: RESCUE, peopleCount: 2}
    responses:
      200:
        description: Suggestion and priority preview
        schema:
          type: object
          example:
            suggestedType: RESCUE
            matchedKeywords: ["water rising", "trapped"]
            urgency: HIGH
            urgentWords: ["elderly couple", "cannot walk"]
            summary: "Elderly couple trapped upstairs with rising water."
            priorityPreview: {type: RESCUE, score: 72, reasons: ["Water rising, cannot self-evacuate: +43", "Elderly couple: +24", "2 people: +5"]}
      400: {description: Missing or invalid fields}
      401: {description: Missing or invalid JWT}
      503: {description: The local LLM (Ollama) could not answer}
    """
    body = request.get_json(silent=True) or {}
    description = body.get("description")
    if not isinstance(description, str):
        raise ApiError(400, "description is required")
    if len(description) > MAX_DESCRIPTION_LENGTH:
        raise ApiError(400, f"description must be at most {MAX_DESCRIPTION_LENGTH} characters")
    request_type = body.get("type") or None
    if request_type is not None and request_type not in REQUEST_TYPES:
        raise ApiError(400, f"type must be one of {', '.join(REQUEST_TYPES)}")
    return jsonify(build_suggestion(description, request_type, parse_people_count(body.get("peopleCount"))))
