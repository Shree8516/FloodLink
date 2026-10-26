# Central error handling for insights-service. Every error becomes the shared JSON format { status, error, message },
# the same one request-service and auth-realtime-service use. Registered in app.py.
import logging
from http import HTTPStatus

from flask import jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    """Raised by our own code for expected problems, e.g. ApiError(400, "request is missing: type")."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def error_response(status, message):
    """Builds the shared error JSON so every handler returns exactly the same shape."""
    return jsonify(status=status, error=HTTPStatus(status).phrase, message=message), status


def register_error_handlers(app):
    """Attaches the handlers to the Flask app so routes don't need try/except blocks."""

    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return error_response(error.status, str(error))

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        # Flask's own errors, e.g. 404 for an unknown URL or 405 for a wrong method
        return error_response(error.code, error.description)

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        # Log the full stack trace for us, send only a generic message to the caller
        logger.exception("Unexpected error")
        return error_response(500, "Something went wrong in insights-service")
