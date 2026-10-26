# Unit tests for the duplicate, priority, stats and suggestion rules, plus the HTTP endpoints with JWT checks.
# Run from the insights-service folder with: python -m unittest discover tests
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

import jwt

from app import create_app
from services.duplicate_service import find_duplicate, haversine_meters
from services.priority_service import calculate_priority
from services.stats_service import summarize_requests
from services.suggest_service import build_suggestion, suggest_type

NOW = datetime(2025, 12, 2, 10, 0, 0)
TEST_SECRET = "test-secret-for-unit-tests-0123456789"


def make_request(request_id=None, request_type="RESCUE", description="Family trapped on terrace, water rising",
                 latitude=12.9815, longitude=80.2180, minutes_ago=0):
    return {"id": request_id, "type": request_type, "description": description,
            "latitude": latitude, "longitude": longitude, "createdAt": NOW - timedelta(minutes=minutes_ago)}


def make_token(role="CITIZEN"):
    """A token shaped exactly like the ones auth-realtime-service issues."""
    payload = {"userId": "u1", "name": "Test User", "email": "test@floodlink.in", "role": role,
               "exp": datetime.now() + timedelta(hours=1)}
    return jwt.encode(payload, TEST_SECRET, algorithm="HS256")


class HaversineTest(unittest.TestCase):

    def test_velachery_to_tambaram_is_about_14_km(self):
        distance = haversine_meters(12.9815, 80.2180, 12.9249, 80.1000)
        self.assertAlmostEqual(distance / 1000, 14.1, delta=1.0)

    def test_same_point_is_zero(self):
        self.assertEqual(haversine_meters(13.0, 80.2, 13.0, 80.2), 0)


class DuplicateDetectionTest(unittest.TestCase):

    def test_similar_nearby_recent_request_is_duplicate(self):
        original = make_request(request_id=7, minutes_ago=30)
        new = make_request(description="Family trapped on the terrace, water is rising", latitude=12.9816)
        self.assertEqual(find_duplicate(new, [original])["id"], 7)

    def test_different_type_is_not_duplicate(self):
        original = make_request(request_id=7, request_type="FOOD")
        self.assertIsNone(find_duplicate(make_request(), [original]))

    def test_far_away_is_not_duplicate(self):
        original = make_request(request_id=7, latitude=12.9900)  # about 950 m north
        self.assertIsNone(find_duplicate(make_request(), [original]))

    def test_older_than_two_hours_is_not_duplicate(self):
        original = make_request(request_id=7, minutes_ago=150)
        self.assertIsNone(find_duplicate(make_request(), [original]))

    def test_different_description_is_not_duplicate(self):
        original = make_request(request_id=7, description="Need drinking water for apartment")
        self.assertIsNone(find_duplicate(make_request(), [original]))


class PriorityScoreTest(unittest.TestCase):

    def test_rescue_beats_shelter_with_same_details(self):
        rescue, _ = calculate_priority("RESCUE", 2, "help needed", NOW, now=NOW)
        shelter, _ = calculate_priority("SHELTER", 2, "help needed", NOW, now=NOW)
        self.assertGreater(rescue, shelter)

    def test_urgent_words_add_points_and_a_reason(self):
        plain, _ = calculate_priority("FOOD", 1, "need food", NOW, now=NOW)
        urgent, reasons = calculate_priority("FOOD", 1, "need food for elderly and child", NOW, now=NOW)
        self.assertEqual(urgent - plain, 10)
        self.assertIn("Urgent words (child, elderly): +10", reasons)

    def test_waiting_longer_raises_priority(self):
        fresh, _ = calculate_priority("FOOD", 1, "need food", NOW, now=NOW)
        old, reasons = calculate_priority("FOOD", 1, "need food", NOW - timedelta(hours=2), now=NOW)
        self.assertEqual(old - fresh, 10)
        self.assertIn("Waiting 2.0 h: +10", reasons)

    def test_reasons_explain_every_part(self):
        score, reasons = calculate_priority("RESCUE", 2, "elderly couple trapped", NOW, now=NOW)
        self.assertEqual(score, 54)
        self.assertEqual(reasons, ["RESCUE request: +40", "2 people affected: +4",
                                   "Urgent words (elderly, trapped): +10"])

    def test_score_never_exceeds_100(self):
        text = "elderly child baby trapped pregnant injured disabled oxygen"
        score, _ = calculate_priority("RESCUE", 50, text, NOW - timedelta(hours=10), now=NOW)
        self.assertEqual(score, 100)


class StatsTest(unittest.TestCase):

    def test_counts_by_type_status_area_and_resolve_time(self):
        requests = [
            {"type": "RESCUE", "status": "OPEN", "address": "Street 1, Velachery", "priorityScore": 60,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:00:00"},
            {"type": "FOOD", "status": "RESOLVED", "address": "Street 2, Velachery", "priorityScore": 40,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:30:00"},
            {"type": "FOOD", "status": "CLAIMED", "address": "Main Road, Tambaram", "priorityScore": 20,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:05:00"},
        ]
        stats = summarize_requests(requests)
        self.assertEqual(stats["requestsByType"], {"RESCUE": 1, "MEDICINE": 0, "FOOD": 2, "SHELTER": 0})
        self.assertEqual(stats["requestsByStatus"], {"OPEN": 1, "CLAIMED": 1, "RESOLVED": 1, "MERGED": 0})
        self.assertEqual(stats["hotspotAreas"][0], {"area": "Velachery", "count": 2})
        self.assertEqual(stats["averagePriority"], 40)
        self.assertEqual(stats["averageResolveMinutes"], 30)

    def test_no_resolved_requests_gives_no_average(self):
        self.assertIsNone(summarize_requests([])["averageResolveMinutes"])

    def test_area_breakdown_counts_statuses_and_resolve_time_per_area(self):
        requests = [
            {"type": "FOOD", "status": "RESOLVED", "address": "Street 1, Velachery", "priorityScore": 40,
             "createdAt": "2025-12-02T10:00:00", "resolvedAt": "2025-12-02T10:40:00", "updatedAt": "2025-12-02T11:00:00"},
            {"type": "RESCUE", "status": "OPEN", "address": "Street 2, Velachery", "priorityScore": 60,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:00:00"},
            {"type": "FOOD", "status": "CLAIMED", "address": "Main Road, Tambaram", "priorityScore": 20,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:05:00"},
        ]
        velachery = summarize_requests(requests)["areaBreakdown"][0]
        self.assertEqual(velachery, {"area": "Velachery", "total": 2, "OPEN": 1, "CLAIMED": 0, "RESOLVED": 1,
                                     "averageResolveMinutes": 40})  # uses resolvedAt, not updatedAt

    def test_merged_duplicates_are_counted_but_not_as_separate_incidents(self):
        requests = [
            {"type": "RESCUE", "status": "OPEN", "address": "Road, Velachery", "priorityScore": 60,
             "createdAt": "2025-12-02T10:00:00", "updatedAt": "2025-12-02T10:00:00"},
            {"type": "RESCUE", "status": "MERGED", "address": "Road, Velachery", "priorityScore": 60,
             "createdAt": "2025-12-02T10:05:00", "updatedAt": "2025-12-02T10:10:00"},
        ]
        stats = summarize_requests(requests)
        self.assertEqual(stats["totalRequests"], 2)
        self.assertEqual(stats["duplicatesMerged"], 1)
        self.assertEqual(stats["requestsByType"]["RESCUE"], 1)
        self.assertEqual(stats["hotspotAreas"], [{"area": "Velachery", "count": 1}])


class SuggestionTest(unittest.TestCase):

    def test_trapped_on_terrace_suggests_rescue(self):
        suggested, words = suggest_type("Family stuck on the terrace, water rising")
        self.assertEqual(suggested, "RESCUE")
        self.assertEqual(words, ["rising", "stuck", "terrace"])

    def test_plural_keywords_match(self):
        self.assertEqual(suggest_type("Need medicines and insulin")[0], "MEDICINE")

    def test_no_keywords_gives_no_suggestion(self):
        self.assertEqual(suggest_type("Please send help"), (None, []))

    def test_preview_matches_the_real_priority_rules(self):
        suggestion = build_suggestion("Elderly couple trapped on first floor", "RESCUE", 2, now=NOW)
        self.assertEqual(suggestion["priorityPreview"]["score"], 54)
        self.assertEqual(suggestion["urgency"], "MEDIUM")
        self.assertEqual(suggestion["urgentWords"], ["elderly", "trapped"])

    def test_preview_uses_the_suggested_type_when_none_is_chosen(self):
        suggestion = build_suggestion("Baby needs milk", None, 1, now=NOW)
        self.assertEqual(suggestion["priorityPreview"]["type"], "FOOD")


class EndpointTest(unittest.TestCase):

    def setUp(self):
        app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                          "JWT_SECRET": TEST_SECRET})
        self.client = app.test_client()

    def post_analyze(self, body, token):
        return self.client.post("/api/v1/analyze", json=body, headers={"Authorization": f"Bearer {token}"})

    def test_analyze_returns_duplicate_priority_and_reasons(self):
        body = {
            "request": {"type": "RESCUE", "description": "Elderly couple trapped on first floor",
                        "latitude": 12.9815, "longitude": 80.2180, "address": "Road, Velachery", "peopleCount": 2},
            "recentRequests": [{"id": 7, "type": "RESCUE", "description": "Elderly couple trapped on 1st floor",
                                "latitude": 12.9816, "longitude": 80.2181,
                                "createdAt": datetime.now().replace(microsecond=0).isoformat()}],
        }
        result = self.post_analyze(body, make_token()).get_json()
        self.assertTrue(result["isDuplicate"])
        self.assertEqual(result["duplicateOfId"], 7)
        self.assertEqual(result["priorityScore"], 54)
        self.assertTrue(result["reasons"][-1].startswith("Possible duplicate of #7"))

    def test_analyze_without_token_returns_401(self):
        response = self.client.post("/api/v1/analyze", json={})
        self.assertEqual(response.status_code, 401)

    def test_analyze_with_forged_token_returns_401(self):
        forged = jwt.encode({"userId": "x", "role": "ADMIN"}, "some-other-secret-0123456789abcdef", algorithm="HS256")
        self.assertEqual(self.post_analyze({}, forged).status_code, 401)

    def test_missing_fields_returns_400(self):
        response = self.post_analyze({"request": {"type": "FOOD"}}, make_token())
        self.assertEqual(response.status_code, 400)
        self.assertIn("missing", response.get_json()["message"])

    def test_suggest_returns_type_urgency_and_preview(self):
        response = self.client.post("/api/v1/suggest", headers={"Authorization": f"Bearer {make_token()}"},
                                    json={"description": "Diabetic patient needs insulin", "peopleCount": 1})
        result = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(result["suggestedType"], "MEDICINE")
        self.assertEqual(result["priorityPreview"]["type"], "MEDICINE")

    def test_suggest_rejects_unknown_type(self):
        response = self.client.post("/api/v1/suggest", headers={"Authorization": f"Bearer {make_token()}"},
                                    json={"description": "help", "type": "BOAT"})
        self.assertEqual(response.status_code, 400)

    def test_stats_requires_admin(self):
        response = self.client.get("/api/v1/stats", headers={"Authorization": f"Bearer {make_token('VOLUNTEER')}"})
        self.assertEqual(response.status_code, 403)

    @patch("routes.report_routes.fetch_all_requests", return_value=[])
    def test_report_page_renders_with_token_in_url(self, _mock_fetch):
        response = self.client.get(f"/report?token={make_token('ADMIN')}")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Insights Report", response.data)


if __name__ == "__main__":
    unittest.main()
