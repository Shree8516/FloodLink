# Priority scoring: turns a help request into a number from 0 to 100 so volunteers know what to do first,
# plus a list of human-readable reasons. Called by routes/analyze_routes.py.
# Four parts add up to exactly 100 at most: 40 + 20 + 15 + 25.
import re
from datetime import datetime

# Part 1 – type of help (max 40). A life in danger (RESCUE) comes before health (MEDICINE),
# then hunger (FOOD), then a roof (SHELTER): people can wait for shelter longer than for a boat.
TYPE_POINTS = {"RESCUE": 40, "MEDICINE": 30, "FOOD": 20, "SHELTER": 15}

# Part 2 – number of people (max 20). 2 points per person, so 10+ people get the full 20.
# Capped so one big group doesn't push a single trapped person off the list.
POINTS_PER_PERSON = 2
MAX_PEOPLE_POINTS = 20

# Part 3 – waiting time (max 15). 5 points per hour unresolved, full after 3 hours,
# so old requests don't get forgotten under newer ones.
POINTS_PER_HOUR_WAITING = 5
MAX_WAITING_POINTS = 15

# Part 4 – urgent words (max 25). Each DIFFERENT word found adds 5. These describe people who
# can't help themselves or who are in immediate danger.
POINTS_PER_URGENT_WORD = 5
MAX_URGENT_WORD_POINTS = 25
URGENT_WORDS = {
    "elderly", "old", "aged",
    "child", "children", "baby", "babies", "infant", "infants", "kid", "kids",
    "trapped", "stuck", "drowning",
    "pregnant",
    "injured", "bleeding", "unconscious",
    "disabled", "diabetic", "dialysis", "oxygen",
}


def type_points(request_type):
    """Unknown types get 0 rather than crashing, so a new type added later still gets scored."""
    return TYPE_POINTS.get(request_type, 0)


def people_points(people_count):
    return min(max(people_count, 0) * POINTS_PER_PERSON, MAX_PEOPLE_POINTS)


def hours_waiting(created_at, now):
    """A request created 'in the future' (small clock difference) counts as 0 hours, never negative."""
    return max((now - created_at).total_seconds() / 3600, 0)


def waiting_points(created_at, now):
    return min(int(hours_waiting(created_at, now) * POINTS_PER_HOUR_WAITING), MAX_WAITING_POINTS)


def find_urgent_words(description):
    """Each urgent word counts once, so repeating "trapped trapped trapped" can't game the score."""
    words_in_text = set(re.findall(r"[a-z]+", description.lower()))
    return sorted(words_in_text & URGENT_WORDS)


def calculate_priority(request_type, people_count, description, created_at, now=None):
    """Returns (score, reasons). Each part adds one reason so the score is never a black box.
    "now" can be passed in by tests to get repeatable results."""
    now = now or datetime.now()
    urgent_words = find_urgent_words(description)

    points_for_type = type_points(request_type)
    points_for_people = people_points(people_count)
    points_for_waiting = waiting_points(created_at, now)
    points_for_words = min(len(urgent_words) * POINTS_PER_URGENT_WORD, MAX_URGENT_WORD_POINTS)

    # The type is always explained (it's the base score); the other parts only when they added points
    reasons = [f"{request_type} request: +{points_for_type}"]
    if points_for_people > 0:
        reasons.append(f"{people_count} {'person' if people_count == 1 else 'people'} affected: +{points_for_people}")
    if points_for_waiting > 0:
        reasons.append(f"Waiting {hours_waiting(created_at, now):.1f} h: +{points_for_waiting}")
    if points_for_words > 0:
        reasons.append(f"Urgent words ({', '.join(urgent_words)}): +{points_for_words}")

    score = points_for_type + points_for_people + points_for_waiting + points_for_words
    return min(score, 100), reasons
