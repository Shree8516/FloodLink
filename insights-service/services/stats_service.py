# Builds the numbers for /api/v1/stats (admin dashboard charts) and /report (printable page).
# summarize_requests() works on the live request list from request-service; summarize_analyses() on our own history.
from collections import Counter, defaultdict
from datetime import datetime

from sqlalchemy import func

from models import AnalysisRecord, db
from services.area import area_from_address

REQUEST_TYPES = ["RESCUE", "MEDICINE", "FOOD", "SHELTER"]
STATUSES = ["OPEN", "CLAIMED", "RESOLVED", "MERGED"]
# The statuses shown per area in the area-wise chart (MERGED reports are folded into their original)
AREA_STATUSES = ["OPEN", "CLAIMED", "RESOLVED"]
TOP_AREAS = 8


def resolve_minutes(request):
    """Minutes from posting to resolving. resolvedAt is recorded since the timeline feature; older resolved
    requests don't have it, and for them updatedAt is the moment they were resolved."""
    resolved_at = request.get("resolvedAt") or request["updatedAt"]
    return (datetime.fromisoformat(resolved_at) - datetime.fromisoformat(request["createdAt"])).total_seconds() / 60


def average_resolve_minutes(requests):
    """Average time to help, over RESOLVED requests only.
    Returns None when nothing is resolved yet (an average of nothing would be misleading)."""
    durations = [resolve_minutes(r) for r in requests if r["status"] == "RESOLVED"]
    return round(sum(durations) / len(durations), 1) if durations else None


def area_breakdown(requests):
    """One row per area (busiest first): how many requests are open, claimed and resolved there, and how long
    help took on average in that area. Feeds the stacked area-wise chart and the resolve-time chart."""
    by_area = defaultdict(list)
    for request in requests:
        by_area[area_from_address(request["address"])].append(request)
    rows = []
    for area, area_requests in by_area.items():
        status_counts = Counter(r["status"] for r in area_requests)
        row = {"area": area, "total": len(area_requests)}
        row.update({status: status_counts.get(status, 0) for status in AREA_STATUSES})
        row["averageResolveMinutes"] = average_resolve_minutes(area_requests)
        rows.append(row)
    rows.sort(key=lambda row: (-row["total"], row["area"]))
    return rows[:TOP_AREAS]


def summarize_requests(requests):
    """Counts by type, status and area, plus averages. Pure function: easy to unit-test with a plain list.
    Merged duplicates count in the status totals, but not as separate incidents by type or area."""
    incidents = [r for r in requests if r["status"] != "MERGED"]
    type_counts = Counter(r["type"] for r in incidents)
    status_counts = Counter(r["status"] for r in requests)
    area_counts = Counter(area_from_address(r["address"]) for r in incidents)
    priorities = [r["priorityScore"] for r in incidents]
    return {
        "totalRequests": len(requests),
        # Every type/status is listed (even with 0) so the charts always show the same bars
        "requestsByType": {t: type_counts.get(t, 0) for t in REQUEST_TYPES},
        "requestsByStatus": {s: status_counts.get(s, 0) for s in STATUSES},
        "hotspotAreas": [{"area": area, "count": count} for area, count in area_counts.most_common(TOP_AREAS)],
        "areaBreakdown": area_breakdown(incidents),
        "averagePriority": round(sum(priorities) / len(priorities), 1) if priorities else 0,
        "averageResolveMinutes": average_resolve_minutes(incidents),
        "duplicatesMerged": status_counts.get("MERGED", 0),
    }


def summarize_analyses():
    """Numbers from our own SQLite history: how many requests we analyzed and how many duplicates we caught."""
    total = db.session.query(func.count(AnalysisRecord.id)).scalar()
    duplicates = db.session.query(func.count(AnalysisRecord.id)).filter(AnalysisRecord.is_duplicate).scalar()
    return {"totalAnalyses": total, "duplicatesCaught": duplicates}


def recent_analyses(limit=10):
    """The latest analyses, newest first, for the report table."""
    return AnalysisRecord.query.order_by(AnalysisRecord.analyzed_at.desc()).limit(limit).all()


def build_stats(requests):
    """Combines both sources into one response for /api/v1/stats."""
    return {**summarize_requests(requests), **summarize_analyses()}
