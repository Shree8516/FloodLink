# JWT validation for insights-service. Tokens are issued by auth-realtime-service; we only VERIFY them
# with the shared JWT_SECRET. Routes use the @require_jwt decorator, e.g. @require_jwt("ADMIN").
from functools import wraps

import jwt
from flask import current_app, g, request

from errors import ApiError


def read_token():
    """Normally the token is in the "Authorization: Bearer <jwt>" header. The /report page is opened as a
    normal browser link, which can't send headers, so there we also accept ?token=<jwt> in the URL."""
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[len("Bearer "):]
    return request.args.get("token")


def require_jwt(*allowed_roles):
    """Decorator: rejects the request with 401 (no/bad token) or 403 (wrong role) before the route runs.
    On success the token payload is available as g.user and the raw token as g.token."""
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            token = read_token()
            if not token:
                raise ApiError(401, "Please log in (missing token)")
            try:
                # decode() checks the HS256 signature AND the expiry time
                payload = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
            except jwt.InvalidTokenError:
                raise ApiError(401, "Invalid or expired token")
            if allowed_roles and payload.get("role") not in allowed_roles:
                raise ApiError(403, f"Only {' or '.join(allowed_roles)} can do this")
            g.user = payload
            g.token = token
            return view(*args, **kwargs)
        return wrapper
    return decorator
