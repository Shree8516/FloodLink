# The GET /report page: a printable HTML summary rendered with Jinja2 from templates/report.html.
# Opened from the admin dashboard as /report?token=<jwt> (a browser link can't send an Authorization header).
from datetime import datetime

from flask import Blueprint, g, render_template

from auth import require_jwt
from services.request_client import fetch_all_requests
from services.stats_service import build_stats, recent_analyses

report_bp = Blueprint("report", __name__)


@report_bp.get("/report")
@require_jwt("ADMIN")
def report_page():
    """Printable HTML report (ADMIN only; pass the JWT as ?token=...).
    ---
    tags: [Report]
    produces: [text/html]
    parameters:
      - {in: query, name: token, type: string, required: true, description: Admin JWT}
    responses:
      200: {description: HTML page with summary statistics}
      401: {description: Missing or invalid JWT}
    """
    stats = build_stats(fetch_all_requests(g.token))
    return render_template("report.html", stats=stats, recent=recent_analyses(),
                           generated_at=datetime.now(), generated_by=g.user.get("name", "Admin"))
