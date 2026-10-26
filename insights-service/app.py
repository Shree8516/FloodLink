# Entry point of insights-service (Flask, port 5001). Run with `python app.py`.
# Builds the Flask app: database, CORS, Swagger docs (/apidocs), logging, error handlers and the route blueprints.
import logging

from flasgger import Swagger
from flask import Flask
from flask_cors import CORS

from config import Config
from errors import register_error_handlers
from models import db
from routes.analyze_routes import analyze_bp
from routes.report_routes import report_bp
from routes.stats_routes import stats_bp
from routes.suggest_routes import suggest_bp


def configure_logging():
    """Prints one readable line per event, e.g. '10:15:02 INFO routes.analyze_routes: Analyzed RESCUE ...'."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s",
                        datefmt="%H:%M:%S")


def create_app(test_config=None):
    """App factory: tests call create_app({...}) with an in-memory database instead of the real file."""
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    # Only the React app's origin may call our /api/v1 endpoints from a browser
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGIN"]}})
    Swagger(app)
    app.register_blueprint(analyze_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(suggest_bp)
    app.register_blueprint(report_bp)
    register_error_handlers(app)

    # Creates the analysis_records table on first run (no migration tool needed for one table)
    with app.app_context():
        db.create_all()
    return app


if __name__ == "__main__":
    configure_logging()
    create_app().run(port=Config.PORT, debug=True)
