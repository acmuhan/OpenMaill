# -*- coding: utf-8 -*-
"""Tool discovery API."""
from flask import Blueprint

from backend.core.responses import ok
from backend.tools.registry import tool_registry

bp = Blueprint("tools_api", __name__, url_prefix="/api")


@bp.get("/tools")
def tools():
    return ok(tools=tool_registry.to_list())
