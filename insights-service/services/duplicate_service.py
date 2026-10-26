# Duplicate detection: decides whether a new help request describes the same incident as a recent one.
# Called by routes/analyze_routes.py. Pure Python functions (no Flask), so they are easy to unit-test.
import math
from datetime import timedelta
from difflib import SequenceMatcher

EARTH_RADIUS_METERS = 6_371_000

# A duplicate must match ALL four rules:
# 1. Same type: FOOD and RESCUE at one address are two different needs, both must be served.
# 2. Within 200 m: the same house or street. GPS taps on a map are never exact, so we allow a small radius.
MAX_DISTANCE_METERS = 200
# 3. Within 2 hours: an older post at the same spot is probably a NEW situation (water rose again).
MAX_TIME_GAP = timedelta(hours=2)
# 4. Descriptions at least 60% alike (difflib ratio from 0.0 = nothing in common to 1.0 = identical).
#    People re-post the same message with small edits, e.g. "trapped on terrace" vs "trapped on the terrace".
MIN_TEXT_SIMILARITY = 0.6


def haversine_meters(lat1, lon1, lat2, lon2):
    """Distance between two GPS points along the Earth's surface.
    Simple subtraction of coordinates is wrong because the Earth is a sphere and a degree of longitude
    gets shorter as you move away from the equator. Haversine handles that."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_METERS * math.asin(math.sqrt(a))


def text_similarity(first, second):
    """How alike two descriptions are (0.0 to 1.0). Lowercased so "Trapped" and "trapped" match."""
    return SequenceMatcher(None, first.lower().strip(), second.lower().strip()).ratio()


def compare(new_request, candidate):
    """Checks rules 1-3 (cheap number checks) first and only then rule 4 (text comparison).
    Returns the match details, or None if any rule fails."""
    if new_request["type"] != candidate["type"]:
        return None
    distance = haversine_meters(new_request["latitude"], new_request["longitude"],
                                candidate["latitude"], candidate["longitude"])
    time_gap = abs(new_request["createdAt"] - candidate["createdAt"])
    if distance > MAX_DISTANCE_METERS or time_gap > MAX_TIME_GAP:
        return None
    similarity = text_similarity(new_request["description"], candidate["description"])
    if similarity <= MIN_TEXT_SIMILARITY:
        return None
    return {"id": candidate["id"], "similarity": similarity, "distance_meters": distance,
            "minutes_apart": time_gap.total_seconds() / 60}


def find_duplicate(new_request, recent_requests):
    """Returns the best match (most similar wording) among recent requests, or None if the request is unique.
    The match details are used to explain the decision in the reasons list."""
    matches = [match for match in (compare(new_request, c) for c in recent_requests) if match]
    if not matches:
        return None
    return max(matches, key=lambda match: match["similarity"])


def describe_duplicate(match):
    """Human-readable reason, e.g. 'Possible duplicate of #7: 82% similar text, 15 m away, 20 min apart'."""
    return (f"Possible duplicate of #{match['id']}: {round(match['similarity'] * 100)}% similar text, "
            f"{round(match['distance_meters'])} m away, {round(match['minutes_apart'])} min apart")
