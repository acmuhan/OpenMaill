# -*- coding: utf-8 -*-
"""Blueprint registration."""

from backend.api.accounts import bp as accounts_bp
from backend.api.mail import bp as mail_bp
from backend.api.tools import bp as tools_bp
from backend.api.web import bp as web_bp


def register_blueprints(app):
    app.register_blueprint(web_bp)
    app.register_blueprint(tools_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(mail_bp)
