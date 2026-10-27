# HTTP endpoints POST /api/v1/analyze and GET /api/v1/health. /analyze is called by request-service every
# time a citizen posts a request (with the citizen's JWT). Validates input, runs the duplicate rule and the
# LLM priority assessment (Ollama), then saves the result.
import logging
from datetime import datetime

from flask import Blueprint, jsonify, request

from auth import require_jwt
from errors import ApiError
from models import AnalysisRecord, db
from services.area import area_from_address
from services.duplicate_service import describe_duplicate, find_duplicate
from services.llm_client import LlmError, list_models, resolve_model
from services.priority_service import calculate_priority

logger = logging.getLogger(__name__)
analyze_bp = Blueprint("analyze", __name__)

REQUIRED_FIELDS = ("type", "description", "latitude", "longitude")


def parse_datetime(value):
    """Spring sends "2025-12-02T10:15:00". Missing means "just now" (a brand-new request)."""
    if not value:
        return datetime.now()
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        raise ApiError(400, f"createdAt must be an ISO date-time, got {value!r}")


def parse_request_item(item, label, require_id=False):
    """Checks one request object and converts its fields to the right Python types."""
    if not isinstance(item, dict):
        raise ApiError(400, f"{label} must be an object")
    missing = [field for field in REQUIRED_FIELDS if item.get(field) in (None, "")]
    if require_id and item.get("id") is None:
        missing.append("id")
    if missing:
        raise ApiError(400, f"{label} is missing: {', '.join(missing)}")
    try:
        return {
            "id": item.get("id"),
            "type": str(item["type"]).upper(),
            "description": str(item["description"]),
            "latitude": float(item["latitude"]),
            "longitude": float(item["longitude"]),
            "address": str(item.get("address") or ""),
            "peopleCount": int(item.get("peopleCount") or 1),
            "createdAt": parse_datetime(item.get("createdAt")),
        }
    except (TypeError, ValueError):
        raise ApiError(400, f"{label} has a field with the wrong type")


def save_analysis(new_request, duplicate, priority_score, reasons):
    """Keeps a history of every analysis for /stats and /report."""
    record = AnalysisRecord(
        request_type=new_request["type"],
        description=new_request["description"][:500],
        area=area_from_address(new_request["address"]),
        people_count=new_request["peopleCount"],
        is_duplicate=duplicate is not None,
        duplicate_of_id=duplicate["id"] if duplicate else None,
        priority_score=priority_score,
        reasons="\n".join(reasons),
    )
    db.session.add(record)
    db.session.commit()


@analyze_bp.post("/api/v1/analyze")
@require_jwt()
def analyze_request():
    """Check a new help request for duplicates and score its priority, with reasons.
    ---
    tags: [Analysis]
    security: [{Bearer: []}]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          example:
            request: {type: RESCUE, description: "Elderly couple trapped on first floor", latitude: 12.9815, longitude: 80.2180, address: "4th Main Road, Velachery", peopleCount: 2, createdAt: "2025-12-02T10:15:00"}
            recentRequests:
              - {id: 7, type: RESCUE, description: "Elderly couple trapped on 1st floor", latitude: 12.9816, longitude: 80.2181, createdAt: "2025-12-02T09:55:00"}
    responses:
      200:
        description: Analysis result
        schema:
          type: object
          example:
            isDuplicate: true
            duplicateOfId: 7
            priorityScore: 70
            reasons: ["Water rising, elderly couple cannot leave first floor: +45", "Elderly, one person immobile: +20", "2 people: +5", "Possible duplicate of #7: 92% similar text, 14 m away, 20 min apart"]
      400: {description: Missing or invalid fields}
      401: {description: Missing or invalid JWT}
      503: {description: The local LLM (Ollama) could not score the request}
    """
    body = request.get_json(silent=True) or {}
    new_request = parse_request_item(body.get("request"), "request")
    recent_requests = [parse_request_item(item, "recentRequests item", require_id=True)
                       for item in body.get("recentRequests") or []]

    duplicate = find_duplicate(new_request, recent_requests)
    priority_score, reasons = calculate_priority(new_request["type"], new_request["peopleCount"],
                                                 new_request["description"], new_request["createdAt"])
    if duplicate:
        reasons.append(describe_duplicate(duplicate))
    save_analysis(new_request, duplicate, priority_score, reasons)

    logger.info("Analyzed %s request: priority=%s duplicateOf=%s",
                new_request["type"], priority_score, duplicate["id"] if duplicate else None)
    return jsonify(isDuplicate=duplicate is not None,
                   duplicateOfId=duplicate["id"] if duplicate else None,
                   priorityScore=priority_score,
                   reasons=reasons)


@analyze_bp.get("/api/v1/health/llm")
def health_llm():
    """Checks that Ollama is running and which model scores the requests (no login needed).
    ---
    tags: [Health]
    responses:
      200:
        description: Ollama is reachable
        schema:
          type: object
          example: {status: UP, model: "qwen2.5:7b", installedModels: ["qwen2.5:7b", "llama3.2:3b"]}
      503: {description: Ollama is not reachable or has no chat model}
    """
    try:
        model = resolve_model()
        return jsonify(status="UP", model=model, installedModels=list_models())
    except LlmError as error:
        return jsonify(status="DOWN", message=str(error)), 503


@analyze_bp.get("/api/v1/health")
def health():
    """Simple check that the service is running (no login needed).
    ---
    tags: [Health]
    responses:
      200:
        description: Service is up
        schema:
          type: object
          example: {status: UP, service: insights-service}
    """
    return jsonify(status="UP", service="insights-service")
