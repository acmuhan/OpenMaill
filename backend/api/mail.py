# -*- coding: utf-8 -*-
"""Mail API routes."""
from flask import Blueprint, request

from backend.core.responses import api_route, ok
from backend.services.mail_service import mail_service

bp = Blueprint("mail_api", __name__, url_prefix="/api")


@bp.post("/token")
@api_route
def token():
    body = request.get_json(force=True)
    return ok(**mail_service.token(body))


@bp.post("/emails")
@api_route
def emails():
    body = request.get_json(force=True)
    return ok(emails=mail_service.emails(body))


@bp.post("/email/body")
@api_route
def email_body():
    body = request.get_json(force=True)
    return ok(**mail_service.email_body(body))
