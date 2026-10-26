# Reads the current list of help requests from request-service (Spring, port 8080).
# Used by /api/v1/stats and /report: request-service owns the live status of every request,
# while this service owns the analysis history. Together they give the full picture.
import requests
from flask import current_app

from errors import ApiError


def fetch_all_requests(token):
    """Forwards the caller's JWT, because request-service validates tokens too."""
    url = f"{current_app.config['REQUEST_SERVICE_URL']}/api/v1/requests"
    try:
        response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as error:
        current_app.logger.warning("Could not load requests from request-service: %s", error)
        raise ApiError(502, "Could not load requests from request-service. Is it running?")
