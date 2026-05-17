# -*- coding: utf-8 -*-
"""Flask application factory."""
import os

from flask import Flask

from backend.api import register_blueprints
from backend.config import Config
from backend.core.responses import fail


def create_app(config_object=Config) -> Flask:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(base_dir, "static", "dist")

    app = Flask(
        __name__,
        static_folder=os.path.join(base_dir, "static"),
        template_folder=dist_dir if os.path.isdir(dist_dir) else os.path.join(base_dir, "templates"),
    )
    app.config.from_object(config_object)
    app.config["BASE_DIR"] = base_dir
    app.config["DIST_DIR"] = dist_dir
    app.secret_key = app.config["SECRET_KEY"]

    register_blueprints(app)

    @app.errorhandler(404)
    def not_found(_error):
        return fail("资源不存在", 404)

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return fail("请求方法不允许", 405)

    return app
