# Keyword-based suggestions for the "Ask for help" form, computed while the citizen types:
# 1. Which TYPE of help the description sounds like (RESCUE / MEDICINE / FOOD / SHELTER), and the words that said so.
# 2. How URGENT it is (HIGH / MEDIUM / LOW), using the same priority rules as /analyze, as a live preview.
# Called by routes/suggest_routes.py. Pure Python functions (no Flask), so they are easy to unit-test.
import re
from datetime import datetime

from services.priority_service import TYPE_POINTS, calculate_priority, find_urgent_words

# Words that point to each type of help. Written in singular; plurals ("medicines") match too (see normalize).
# "water" is left out on purpose: it appears in both rescue ("water at chest level") and food ("drinking water").
TYPE_KEYWORDS = {
    "RESCUE": {"trapped", "stuck", "stranded", "drowning", "rescue", "boat", "terrace", "rooftop", "roof", "rising",
               "chest", "neck", "swept", "collapsed", "evacuate", "evacuation", "marooned"},
    "MEDICINE": {"medicine", "medical", "insulin", "dialysis", "oxygen", "fever", "injured", "injury", "bleeding",
                 "hospital", "doctor", "tablet", "ambulance", "diabetic", "asthma", "pregnant", "unconscious",
                 "paracetamol", "ors", "wound", "patient"},
    "FOOD": {"food", "hungry", "meal", "rice", "packet", "milk", "drinking", "ration", "starving", "biscuit",
             "bread", "eat", "grocery", "cooking", "formula"},
    "SHELTER": {"shelter", "camp", "homeless", "tent", "blanket", "sleep", "night", "washed", "relief", "hut",
                "accommodation", "bedding", "roofless"},
}

# Same thresholds as the PriorityBadge in the React app, so the form and the cards always agree
HIGH_PRIORITY = 70
MEDIUM_PRIORITY = 40


def normalize(word):
    """'medicines' -> 'medicine', 'packets' -> 'packet'. Short words like 'ors' are left alone."""
    return word[:-1] if len(word) > 3 and word.endswith("s") else word


def matched_keywords(description, request_type):
    words = {normalize(word) for word in re.findall(r"[a-z]+", description.lower())}
    return sorted(words & TYPE_KEYWORDS[request_type])


def suggest_type(description):
    """Returns (type, keywords) for the type with the most matching words, or (None, []) if nothing matched.
    A tie goes to the more life-critical type (RESCUE before MEDICINE before FOOD before SHELTER), because
    suggesting too urgent a type is safer than too relaxed a one."""
    best_type, best_words = None, []
    for request_type in sorted(TYPE_KEYWORDS, key=lambda t: -TYPE_POINTS[t]):
        words = matched_keywords(description, request_type)
        if len(words) > len(best_words):
            best_type, best_words = request_type, words
    return best_type, best_words


def urgency_level(score):
    if score >= HIGH_PRIORITY:
        return "HIGH"
    if score >= MEDIUM_PRIORITY:
        return "MEDIUM"
    return "LOW"


def build_suggestion(description, request_type=None, people_count=1, now=None):
    """The full answer for POST /api/v1/suggest. The preview scores the type the user picked (or else the
    suggested one) exactly like /analyze would score a brand-new request, so it predicts the final priority.
    Duplicate checks are not part of the preview: they need the saved request list."""
    suggested_type, keywords = suggest_type(description)
    preview_type = request_type or suggested_type
    preview = None
    urgency = None
    if preview_type:
        now = now or datetime.now()
        score, reasons = calculate_priority(preview_type, people_count, description, now, now=now)
        preview = {"type": preview_type, "score": score, "reasons": reasons}
        urgency = urgency_level(score)
    return {
        "suggestedType": suggested_type,
        "matchedKeywords": keywords,
        "urgency": urgency,
        "urgentWords": find_urgent_words(description),
        "priorityPreview": preview,
    }
