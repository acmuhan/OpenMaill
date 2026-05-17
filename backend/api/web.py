# -*- coding: utf-8 -*-
"""Browser-facing routes."""
import json
import os

from flask import Blueprint, current_app, render_template, send_from_directory

from backend.config import Config

bp = Blueprint("web", __name__)


@bp.route("/")
def index():
    dist_dir = current_app.config["DIST_DIR"]
    dist_index = os.path.join(dist_dir, "index.html")
    defaults_json = json.dumps(Config.public_defaults(), ensure_ascii=False)

    if os.path.isfile(dist_index):
        with open(dist_index, "r", encoding="utf-8") as f:
            html = f.read()
        injected = f"<script>window.APP_DEFAULTS = {defaults_json};</script>"
        return html.replace("</head>", injected + "</head>", 1)

    return render_template("index.html", defaults=Config.public_defaults())


@bp.route("/favicon.ico")
def favicon():
    dist_dir = current_app.config["DIST_DIR"]
    if os.path.isfile(os.path.join(dist_dir, "favicon.svg")):
        return send_from_directory(dist_dir, "favicon.svg")
    return ("", 204)
