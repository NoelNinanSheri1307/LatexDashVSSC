from flask import Blueprint
from flask import jsonify
from flask import request

from backend.services.user_analytics_service import get_user_summary
from backend.services.user_analytics_service import get_user_activity
from backend.services.user_analytics_service import get_user_growth
from backend.services.user_analytics_service import get_login_stats
from backend.services.user_analytics_service import get_user_list


users_bp = Blueprint("users", __name__, url_prefix = "/usage-stats/users")


@users_bp.route("/summary", methods = ["GET"])
def user_summary():
    return jsonify(get_user_summary())


@users_bp.route("/activity", methods = ["GET"])
def user_activity():
    return jsonify(get_user_activity())


@users_bp.route("/growth", methods = ["GET"])
def user_growth():
    frequency = request.args.get("frequency", "month")
    return jsonify(get_user_growth(frequency))


@users_bp.route("/login-stats", methods = ["GET"])
def login_stats():
    return jsonify(get_login_stats())


@users_bp.route("/list", methods = ["GET"])
def user_list():
    return jsonify(get_user_list())