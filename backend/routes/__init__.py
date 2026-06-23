from backend.routes.analytics import analytics_bp
from backend.routes.collaboration_stats import collaboration_bp
from backend.routes.content_stats import contents_bp
from backend.routes.project_stats import projects_bp
from backend.routes.user_stats import users_bp


def register_routes(app):
    app.register_blueprint(analytics_bp)
    app.register_blueprint(collaboration_bp)
    app.register_blueprint(contents_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(users_bp)