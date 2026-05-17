# -*- coding: utf-8 -*-
"""Concrete mail tools."""
from typing import Any

from backend.core.errors import NotAvailableError, UpstreamError
from backend.tools.base import MailTool, ToolDefinition
from mail_reader import get_access_token, get_email_body, list_emails


class OutlookMailTool(MailTool):
    definition = ToolDefinition(
        id="outlook",
        name="Outlook / Hotmail",
        category="mail",
        vendor="microsoft",
        description="通过 Microsoft OAuth2 和 Graph API 读取邮件。",
        fields=[
            {"id": "email", "name": "邮箱地址", "type": "email", "required": True},
            {"id": "client_id", "name": "Client ID", "type": "text", "required": True},
            {"id": "refresh_token", "name": "Refresh Token", "type": "textarea", "required": True},
        ],
    )

    def token(self, config: dict[str, Any]) -> dict:
        try:
            return get_access_token(config["refresh_token"], config["client_id"])
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
        try:
            return list_emails(config["email"], access_token, folder=folder, limit=limit)
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict:
        try:
            return get_email_body(config["email"], access_token, mail_id)
        except Exception as exc:
            raise UpstreamError(exc) from exc


class ReservedMailTool(MailTool):
    def token(self, config: dict[str, Any]) -> dict:
        raise NotAvailableError("当前邮箱协议尚未上线")

    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
        raise NotAvailableError("当前邮箱协议尚未上线")

    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict:
        raise NotAvailableError("当前邮箱协议尚未上线")


class GmailMailTool(ReservedMailTool):
    definition = ToolDefinition(
        id="gmail",
        name="Gmail",
        category="mail",
        vendor="google",
        available=False,
        description="Gmail API 接入预留。",
    )


class ImapMailTool(ReservedMailTool):
    definition = ToolDefinition(
        id="imap",
        name="通用 IMAP",
        category="mail",
        vendor="imap",
        available=False,
        description="通用 IMAP 接入预留。",
    )
