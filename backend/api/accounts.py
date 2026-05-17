# -*- coding: utf-8 -*-
"""Account provider API routes."""
from flask import Blueprint, request

from backend.core.responses import api_route, ok
from backend.services.account_service import account_service

bp = Blueprint("accounts_api", __name__, url_prefix="/api")


@bp.post("/balance")
@api_route
def balance():
    body = request.get_json(force=True)
    return ok(balance=account_service.balance(body))


@bp.post("/accounts")
@api_route
def accounts():
    body = request.get_json(force=True)
    return ok(accounts=account_service.accounts(body))


@bp.post("/history")
@api_route
def history():
    body = request.get_json(force=True)
    return ok(data=account_service.history(body))
