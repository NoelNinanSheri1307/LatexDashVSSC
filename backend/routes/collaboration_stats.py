from flask import Blueprint
from flask import jsonify

from backend.services.collaboration_service import get_collaboration_distribution


collaboration_bp = Blueprint("collaboration", __name__, url_prefix = "/usage-stats/collaboration")

@collaboration_bp.route("/distribution", methods = ["GET"])
def collaboration_distribution():
    return jsonify(get_collaboration_distribution())