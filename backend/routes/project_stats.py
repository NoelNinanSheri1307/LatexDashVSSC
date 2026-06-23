from flask import Blueprint
from flask import jsonify
from flask import request

from backend.services.project_analytics_service import get_project_summary
from backend.services.project_analytics_service import get_project_activity
from backend.services.project_analytics_service import get_project_growth


projects_bp = Blueprint("projects", __name__, url_prefix = "/usage-stats/projects")


@projects_bp.route("/summary", methods = ["GET"])
def project_summary():
    return jsonify(get_project_summary())


@projects_bp.route("/activity", methods = ["GET"])
def project_activity():
    return jsonify(get_project_activity())


@projects_bp.route("/growth", methods = ["GET"])
def project_growth():
    frequency = request.args.get("frequency", "month")
    return jsonify(get_project_growth(frequency))