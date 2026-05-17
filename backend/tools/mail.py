# -*- coding: utf-8 -*-
"""Concrete mail tools."""
import base64
import html
import imaplib
import re
from email import policy
from email.header import decode_header, make_header
from email.parser import BytesParser
from email.utils import parsedate_to_datetime, parseaddr
from typing import Any

import requests

from backend.core.errors import NotAvailableError, UpstreamError
from backend.tools.base import MailTool, ToolDefinition
from mail_reader import get_access_token, get_email_body, list_emails

GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1"

GMAIL_LABEL_MAP = {
    "INBOX": "INBOX",
    "inbox": "INBOX",
    "Sent": "SENT",
    "sent": "SENT",
    "sentitems": "SENT",
    "Drafts": "DRAFT",
    "drafts": "DRAFT",
    "Deleted": "TRASH",
    "deleted": "TRASH",
    "deleteditems": "TRASH",
    "Trash": "TRASH",
    "Junk": "SPAM",
    "Spam": "SPAM",
    "junkemail": "SPAM",
}


def _headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def _strip_html(value: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", "", value or "")
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p\s*>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _decode_gmail_data(data: str) -> str:
    if not data:
        return ""
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8", errors="replace")


def _gmail_headers(message: dict) -> dict[str, str]:
    headers = message.get("payload", {}).get("headers", [])
    return {h.get("name", "").lower(): h.get("value", "") for h in headers}


def _address_only(value: str) -> str:
    name, address = parseaddr(value or "")
    return address or name or value or ""


def _gmail_part_body(part: dict) -> str:
    data = part.get("body", {}).get("data", "")
    return _decode_gmail_data(data)


def _walk_gmail_parts(part: dict):
    yield part
    for child in part.get("parts", []) or []:
        yield from _walk_gmail_parts(child)


def _gmail_body(payload: dict) -> str:
    html_body = ""
    for part in _walk_gmail_parts(payload):
        mime_type = part.get("mimeType", "")
        if mime_type == "text/plain":
            body = _gmail_part_body(part).strip()
            if body:
                return body
        if mime_type == "text/html" and not html_body:
            html_body = _gmail_part_body(part)
    return _strip_html(html_body)


def _decode_header_value(value: str | None) -> str:
    if not value:
        return ""
    try:
        return str(make_header(decode_header(value)))
    except Exception:
        return value


def _decode_bytes(payload: bytes, charset: str | None) -> str:
    for encoding in (charset, "utf-8", "gb18030", "latin-1"):
        if not encoding:
            continue
        try:
            return payload.decode(encoding, errors="replace")
        except LookupError:
            continue
    return payload.decode("utf-8", errors="replace")


def _message_body(message) -> str:
    html_body = ""
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_maintype() == "multipart":
                continue
            disposition = (part.get_content_disposition() or "").lower()
            if disposition == "attachment":
                continue
            content_type = part.get_content_type()
            payload = part.get_payload(decode=True)
            if payload is None:
                continue
            text = _decode_bytes(payload, part.get_content_charset())
            if content_type == "text/plain" and text.strip():
                return text.strip()
            if content_type == "text/html" and not html_body:
                html_body = text
    else:
        payload = message.get_payload(decode=True)
        if payload is not None:
            text = _decode_bytes(payload, message.get_content_charset())
            return _strip_html(text) if message.get_content_type() == "text/html" else text.strip()
    return _strip_html(html_body)


def _imap_bool(value: Any, default: bool = True) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() not in {"0", "false", "no", "off", "不"}


def _imap_date(value: str) -> str:
    try:
        dt = parsedate_to_datetime(value)
        return dt.isoformat()
    except Exception:
        return value or ""


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


def _gmail_token(config: dict[str, Any]) -> dict:
    data = {
        "client_id": config["client_id"],
        "refresh_token": config["refresh_token"],
        "grant_type": "refresh_token",
    }
    client_secret = str(config.get("client_secret", "")).strip()
    if client_secret:
        data["client_secret"] = client_secret

    resp = requests.post(GMAIL_TOKEN_URL, data=data, timeout=30)
    try:
        payload = resp.json()
    except Exception as exc:
        raise RuntimeError(f"获取 Gmail access_token 失败: HTTP {resp.status_code}") from exc

    if resp.status_code != 200 or payload.get("error"):
        desc = payload.get("error_description") or payload.get("error") or resp.text[:300]
        raise RuntimeError(f"获取 Gmail access_token 失败: {desc}")

    return {"access_token": payload["access_token"]}


def _gmail_list_emails(config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
    user_id = config.get("email") or "me"
    label = GMAIL_LABEL_MAP.get(folder, folder or "INBOX")
    params = {"maxResults": limit, "labelIds": label}
    resp = requests.get(
        f"{GMAIL_API_BASE}/users/{user_id}/messages",
        headers=_headers(access_token),
        params=params,
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"读取 Gmail 邮件失败: {resp.status_code} {resp.text[:300]}")

    messages = resp.json().get("messages", [])
    result: list[dict] = []
    for item in messages:
        detail = requests.get(
            f"{GMAIL_API_BASE}/users/{user_id}/messages/{item['id']}",
            headers=_headers(access_token),
            params={
                "format": "metadata",
                "metadataHeaders": ["Subject", "From", "Date"],
            },
            timeout=30,
        )
        if detail.status_code != 200:
            raise RuntimeError(f"读取 Gmail 邮件失败: {detail.status_code} {detail.text[:300]}")
        message = detail.json()
        headers = _gmail_headers(message)
        result.append(
            {
                "id": message.get("id", item["id"]),
                "subject": _decode_header_value(headers.get("subject")) or "(无主题)",
                "from": _address_only(headers.get("from", "")),
                "date": headers.get("date", ""),
            }
        )
    return result


def _gmail_email_body(config: dict[str, Any], access_token: str, mail_id: str) -> dict:
    user_id = config.get("email") or "me"
    resp = requests.get(
        f"{GMAIL_API_BASE}/users/{user_id}/messages/{mail_id}",
        headers=_headers(access_token),
        params={"format": "full"},
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"读取 Gmail 邮件正文失败: {resp.status_code} {resp.text[:300]}")

    message = resp.json()
    headers = _gmail_headers(message)
    return {
        "subject": _decode_header_value(headers.get("subject")) or "(无主题)",
        "from": _address_only(headers.get("from", "")),
        "date": headers.get("date", ""),
        "body": _gmail_body(message.get("payload", {})),
    }


class ReservedMailTool(MailTool):
    def token(self, config: dict[str, Any]) -> dict:
        raise NotAvailableError("当前邮箱协议未启用")

    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
        raise NotAvailableError("当前邮箱协议未启用")

    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict:
        raise NotAvailableError("当前邮箱协议未启用")


class GmailMailTool(ReservedMailTool):
    definition = ToolDefinition(
        id="gmail",
        name="Gmail",
        category="mail",
        vendor="google",
        available=True,
        description="通过 Google OAuth2 和 Gmail REST API 读取邮件。",
        fields=[
            {"id": "email", "name": "邮箱地址", "type": "email", "required": True},
            {"id": "client_id", "name": "Client ID", "type": "text", "required": True},
            {"id": "client_secret", "name": "Client Secret", "type": "password", "required": False},
            {"id": "refresh_token", "name": "Refresh Token", "type": "textarea", "required": True},
        ],
    )

    def token(self, config: dict[str, Any]) -> dict:
        try:
            return _gmail_token(config)
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
        try:
            return _gmail_list_emails(config, access_token, folder=folder, limit=limit)
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict:
        try:
            return _gmail_email_body(config, access_token, mail_id)
        except Exception as exc:
            raise UpstreamError(exc) from exc


class ImapMailTool(ReservedMailTool):
    definition = ToolDefinition(
        id="imap",
        name="通用 IMAP",
        category="mail",
        vendor="imap",
        available=True,
        description="通过标准 IMAP 读取自建邮箱、企业邮箱和支持 App Password 的邮箱。",
        fields=[
            {"id": "email", "name": "邮箱地址", "type": "email", "required": True},
            {"id": "host", "name": "IMAP Host", "type": "text", "required": True},
            {"id": "port", "name": "IMAP Port", "type": "number", "required": False},
            {"id": "ssl", "name": "SSL", "type": "switch", "required": False},
            {"id": "username", "name": "用户名", "type": "text", "required": False},
            {"id": "password", "name": "密码", "type": "password", "required": True},
        ],
    )

    def token(self, config: dict[str, Any]) -> dict:
        host = str(config.get("host", "")).strip()
        email_addr = str(config.get("email", "")).strip()
        password = str(config.get("password", "")).strip()
        if not host:
            raise ValueError("IMAP Host 不能为空")
        if not email_addr:
            raise ValueError("邮箱地址不能为空")
        if not password:
            raise ValueError("密码不能为空")

        username = str(config.get("username") or email_addr).strip()
        port = int(config.get("port") or (993 if _imap_bool(config.get("ssl"), True) else 143))
        use_ssl = _imap_bool(config.get("ssl"), True)

        try:
            client = imaplib.IMAP4_SSL(host, port) if use_ssl else imaplib.IMAP4(host, port)
            client.login(username, password)
            client.logout()
        except Exception as exc:
            raise UpstreamError(exc) from exc

        return {"access_token": password}

    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]:
        host = str(config.get("host", "")).strip()
        email_addr = str(config.get("email", "")).strip()
        username = str(config.get("username") or email_addr).strip()
        password = str(access_token or config.get("password", "")).strip()
        port = int(config.get("port") or (993 if _imap_bool(config.get("ssl"), True) else 143))
        use_ssl = _imap_bool(config.get("ssl"), True)

        if not host:
            raise ValueError("IMAP Host 不能为空")
        if not username:
            raise ValueError("用户名不能为空")
        if not password:
            raise ValueError("密码不能为空")

        try:
            client = imaplib.IMAP4_SSL(host, port) if use_ssl else imaplib.IMAP4(host, port)
            client.login(username, password)
            status, _ = client.select(folder or "INBOX", readonly=True)
            if status != "OK":
                raise RuntimeError(f"选择文件夹失败: {folder or 'INBOX'}")

            status, data = client.uid("search", None, "ALL")
            if status != "OK":
                raise RuntimeError("读取邮件列表失败")

            uids = [uid for uid in (data[0].split() if data and data[0] else []) if uid]
            result: list[dict] = []
            for uid in reversed(uids[-limit:]):
                status, msg_data = client.uid(
                    "fetch",
                    uid.decode("ascii"),
                    "(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE)])",
                )
                if status != "OK" or not msg_data:
                    continue
                raw = b"".join(part[1] for part in msg_data if isinstance(part, tuple) and part[1])
                message = BytesParser(policy=policy.default).parsebytes(raw)
                result.append(
                    {
                        "id": uid.decode("ascii"),
                        "subject": _decode_header_value(message.get("subject")) or "(无主题)",
                        "from": _address_only(message.get("from", "")),
                        "date": _imap_date(message.get("date", "")),
                    }
                )
            client.logout()
            return result
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict:
        host = str(config.get("host", "")).strip()
        email_addr = str(config.get("email", "")).strip()
        username = str(config.get("username") or email_addr).strip()
        password = str(access_token or config.get("password", "")).strip()
        port = int(config.get("port") or (993 if _imap_bool(config.get("ssl"), True) else 143))
        use_ssl = _imap_bool(config.get("ssl"), True)

        if not host:
            raise ValueError("IMAP Host 不能为空")
        if not username:
            raise ValueError("用户名不能为空")
        if not password:
            raise ValueError("密码不能为空")

        try:
            client = imaplib.IMAP4_SSL(host, port) if use_ssl else imaplib.IMAP4(host, port)
            client.login(username, password)
            status, _ = client.select(str(config.get("folder", "INBOX") or "INBOX"), readonly=True)
            if status != "OK":
                raise RuntimeError("选择文件夹失败")

            status, msg_data = client.uid("fetch", str(mail_id), "(RFC822)")
            if status != "OK":
                raise RuntimeError("读取邮件正文失败")

            raw = b"".join(part[1] for part in msg_data if isinstance(part, tuple) and part[1])
            message = BytesParser(policy=policy.default).parsebytes(raw)
            body = _message_body(message)
            client.logout()
            return {
                "subject": _decode_header_value(message.get("subject")) or "(无主题)",
                "from": _address_only(message.get("from", "")),
                "date": _imap_date(message.get("date", "")),
                "body": body,
            }
        except Exception as exc:
            raise UpstreamError(exc) from exc
