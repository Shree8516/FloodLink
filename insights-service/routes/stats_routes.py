# GET /api/v1/stats: numbers for the React admin dashboard charts (by type, status, area-wise breakdown,
# duplicates caught and merged, average resolve time overall and per area). Admins only.
from flask import Blueprint, g, jsonify

from auth import require_jwt
from services.request_client import fetch_all_requests
from services.stats_service import build_stats

stats_bp = Blueprint("stats", __name__)


@stats_bp.get("/api/v1/stats")
@require_jwt("ADMIN")
def get_stats():
    """Dashboard statistics (ADMIN only).
    ---
    tags: [Stats]
    security: [{Bearer: []}]
    responses:
      200:
        description: Combined statistics from request-service data and the analysis history
        schema:
          type: object
          example:
            totalRequests: 16
            requestsByType: {RESCUE: 4, MEDICINE: 4, FOOD: 4, SHELTER: 3}
            requestsByStatus: {OPEN: 10, CLAIMED: 3, RESOLVED: 2, MERGED: 1}
            hotspotAreas: [{area: Velachery, count: 3}, {area: Tambaram, count: 2}]
            areaBreakdown:
              - {area: Velachery, total: 3, OPEN: 2, CLAIMED: 0, RESOLVED: 1, averageResolveMinutes: 18.0}
              - {area: Tambaram, total: 2, OPEN: 1, CLAIMED: 1, RESOLVED: 0, averageResolveMinutes: null}
            averagePriority: 48.7
            averageResolveMinutes: 12.5
            duplicatesMerged: 1
            totalAnalyses: 17
            duplicatesCaught: 1
      401: {description: Missing or invalid JWT}
      403: {description: Not an admin}
      502: {description: request-service is not reachable}
    """
    return jsonify(build_stats(fetch_all_requests(g.token)))
