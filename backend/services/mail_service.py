# -*- coding: utf-8 -*-
"""Mail business orchestration."""
from typing import Any

from backend.core.errors import ValidationError
from backend.tools.registry import tool_registry


class MailService:
    def token(self, body: dict[str, Any]) -> dict:
        tool = tool_registry.mail(body.get("tool", "outlook"))
        return tool.token({
            "refresh_token": body["refresh_token"],
            "client_id": body["client_id"],
        })

    def emails(self, body: dict[str, Any]) -> list[dict]:
        tool = tool_registry.mail(body.get("tool", "outlook"))
        limit = int(body.get("limit", 20))
        if limit < 1:
            raise ValidationError("邮件数量必须大于 0")
        return tool.emails(
            {"email": body["email"]},
            access_token=body["access_token"],
            folder=str(body.get("folder", "INBOX") or "INBOX"),
            limit=limit,
        )

    def email_body(self, body: dict[str, Any]) -> dict:
        tool = tool_registry.mail(body.get("tool", "outlook"))
        return tool.email_body(
            {"email": body["email"]},
            access_token=body["access_token"],
            mail_id=body["mail_id"],
        )


mail_service = MailService()
