from flask import Blueprint
from flask import jsonify

from backend.services.content_service import get_content_summary
from backend.services.content_service import get_file_types


contents_bp = Blueprint("content", __name__, url_prefix = "/usage-stats/content")


@contents_bp.route("/summary", methods = ["GET"])
def content_summary():
    return jsonify(get_content_summary())


@contents_bp.route("/fileTypes", methods = ["GET"])
def file_types():
    return jsonify(get_file_types())