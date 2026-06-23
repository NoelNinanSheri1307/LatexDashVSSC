from flask import Blueprint
from flask import request
from flask import jsonify

from backend.services.overview_service import get_overview
from backend.services.session_service import get_session_summary


analytics_bp = Blueprint("analytics", __name__, url_prefix = "/usage-stats/analytics")


@analytics_bp.route("/overview", methods = ["GET"])
def overview():
    return jsonify(get_overview())



# @analytics_bp.route("/sessions/summary", methods = ["GET"])
# def session_summary():
#     return jsonify(get_session_summary())
