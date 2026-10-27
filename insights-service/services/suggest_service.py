# LLM-based suggestions for the "Ask for help" form, computed while the citizen types:
# 1. Which TYPE of help the description sounds like (RESCUE / MEDICINE / FOOD / SHELTER), with the phrases that said so.
# 2. How URGENT it is (HIGH / MEDIUM / LOW), from the same LLM assessment /analyze uses, as a live preview.
# The understanding of the text is done by the local model (services/priority_service.py); nothing is matched by keyword.
# Called by routes/suggest_routes.py. Pure Python functions (no Flask), so they are easy to unit-test.
from datetime import datetime

from services.priority_service import assess_request

# Same thresholds as the PriorityBadge in the React app, so the form and the cards always agree
HIGH_PRIORITY = 70
MEDIUM_PRIORITY = 40


def urgency_level(score):
    if score >= HIGH_PRIORITY:
        return "HIGH"
    if score >= MEDIUM_PRIORITY:
        return "MEDIUM"
    return "LOW"


def build_suggestion(description, request_type=None, people_count=1, now=None):
    """The full answer for POST /api/v1/suggest. The preview scores the type the user picked (or else the one the
    model suggests) exactly like /analyze would score a brand-new request, so it predicts the final priority.
    Duplicate checks are not part of the preview: they need the saved request list.
    Raises LlmError when the local model cannot answer."""
    now = now or datetime.now()
    assessment = assess_request(request_type, people_count, description, now, now=now)
    preview_type = request_type or assessment["suggestedType"]
    preview = {"type": preview_type, "score": assessment["score"], "reasons": assessment["reasons"]}
    return {
        "suggestedType": assessment["suggestedType"],
        # Field names kept from the keyword version so the API contract and the React app don't change
        "matchedKeywords": assessment["typeEvidence"],
        "urgency": urgency_level(assessment["score"]),
        "urgentWords": assessment["urgentCues"],
        "summary": assessment["summary"],
        "priorityPreview": preview,
    }
