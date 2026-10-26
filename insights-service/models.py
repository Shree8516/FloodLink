# Database model for insights-service: every analysis we run is saved as one AnalysisRecord row (SQLite).
# Written by routes/analyze_routes.py, read by services/stats_service.py for /api/v1/stats and /report.
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class AnalysisRecord(db.Model):
    __tablename__ = "analysis_records"

    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    area = db.Column(db.String(100), nullable=False)
    people_count = db.Column(db.Integer, nullable=False)
    is_duplicate = db.Column(db.Boolean, nullable=False, default=False)
    duplicate_of_id = db.Column(db.Integer, nullable=True)
    priority_score = db.Column(db.Integer, nullable=False)
    # The human-readable reasons, one per line
    reasons = db.Column(db.Text, nullable=False, default="")
    analyzed_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
