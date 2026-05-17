# -*- coding: utf-8 -*-
"""Concrete account tools."""
from typing import Any

import requests

from account_api import get_accounts, get_balance, get_history
from backend.core.errors import UpstreamError, ValidationError
from backend.tools.base import AccountTool, ToolDefinition


def _parse_accounts_blob(blob: str, separator: str = ':') -> list[dict]:
    accounts: list[dict] = []
    normalized = blob.replace("\r\n<br>", "\n").replace("<br>", "\n")
    for line in normalized.splitlines():
        line = line.strip()
        if not line or '@' not in line:
            continue
        parts = line.split('----') if '----' in line else line.split(separator)
        if len(parts) < 2:
            continue
        email = parts[0].strip()
        password = parts[1].strip() if len(parts) > 1 else ''
        if email and password:
            accounts.append({'email': email, 'password': password})
    return accounts


def _request_json(base_url: str, path: str, params: dict[str, Any], timeout: int = 30) -> dict[str, Any]:
    url = base_url.rstrip('/') + '/' + path.lstrip('/')
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


class ZhanghaoyaAccountTool(AccountTool):
    definition = ToolDefinition(
        id="zhanghaoya",
        name="第三方账号 API",
        category="account",
        vendor="zhanghaoya",
        description="当前接入的第三方账号购买、余额和历史接口。",
        fields=[
            {"id": "base_url", "name": "API 服务器地址", "type": "url", "required": True},
            {"id": "key", "name": "API Key", "type": "password", "required": True},
        ],
    )

    def balance(self, config: dict[str, Any]) -> str:
        try:
            return get_balance(config["base_url"], config["key"])
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def accounts(self, config: dict[str, Any], account_type: str, quantity: int) -> list[dict]:
        try:
            return get_accounts(config["base_url"], config["key"], account_type, quantity)
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def history(self, config: dict[str, Any], account_type: str) -> str:
        try:
            return get_history(config["base_url"], config["key"], account_type)
        except Exception as exc:
            raise UpstreamError(exc) from exc


class CustomAccountTool(ZhanghaoyaAccountTool):
    definition = ToolDefinition(
        id="custom-account",
        name="自定义账号源",
        category="account",
        vendor="custom",
        description="自定义第三方账号 API，支持自定义路径、参数名与响应字段。",
        fields=[
            {"id": "base_url", "name": "API 服务器地址", "type": "url", "required": True},
            {"id": "key", "name": "API Key", "type": "password", "required": True},
            {"id": "balance_path", "name": "余额路径", "type": "text", "required": True, "default": "/store/ga/balance"},
            {"id": "account_path", "name": "账号路径", "type": "text", "required": True, "default": "/store/ga/account"},
            {"id": "history_path", "name": "历史路径", "type": "text", "required": True, "default": "/store/ga/history"},
            {"id": "key_param", "name": "Key 参数名", "type": "text", "required": True, "default": "key"},
            {"id": "type_param", "name": "类型参数名", "type": "text", "required": True, "default": "type"},
            {"id": "quantity_param", "name": "数量参数名", "type": "text", "required": True, "default": "quantity"},
            {"id": "response_code_key", "name": "状态码字段", "type": "text", "required": True, "default": "Code"},
            {"id": "success_code", "name": "成功状态码", "type": "text", "required": True, "default": "200"},
            {"id": "response_data_key", "name": "数据字段", "type": "text", "required": True, "default": "Data"},
            {"id": "response_message_key", "name": "消息字段", "type": "text", "required": True, "default": "Message"},
            {"id": "account_separator", "name": "账号分隔符", "type": "text", "required": True, "default": ":"},
        ],
    )

    def _config(self, config: dict[str, Any]) -> dict[str, Any]:
        base_url = str(config.get("base_url", "")).strip().rstrip("/")
        key = str(config.get("key", "")).strip()
        if not base_url:
            raise ValidationError("请填写 API 服务器地址")
        if not key:
            raise ValidationError("请填写 API Key")
        return {
            "base_url": base_url,
            "key": key,
            "balance_path": str(config.get("balance_path", "/store/ga/balance")).strip() or "/store/ga/balance",
            "account_path": str(config.get("account_path", "/store/ga/account")).strip() or "/store/ga/account",
            "history_path": str(config.get("history_path", "/store/ga/history")).strip() or "/store/ga/history",
            "key_param": str(config.get("key_param", "key")).strip() or "key",
            "type_param": str(config.get("type_param", "type")).strip() or "type",
            "quantity_param": str(config.get("quantity_param", "quantity")).strip() or "quantity",
            "response_code_key": str(config.get("response_code_key", "Code")).strip() or "Code",
            "success_code": str(config.get("success_code", "200")).strip() or "200",
            "response_data_key": str(config.get("response_data_key", "Data")).strip() or "Data",
            "response_message_key": str(config.get("response_message_key", "Message")).strip() or "Message",
            "account_separator": str(config.get("account_separator", ":")).strip() or ":",
        }

    def _read(self, config: dict[str, Any], path: str, params: dict[str, Any]) -> dict[str, Any]:
        try:
            return _request_json(config["base_url"], path, params)
        except Exception as exc:
            raise UpstreamError(exc) from exc

    def balance(self, config: dict[str, Any]) -> str:
        cfg = self._config(config)
        body = self._read(cfg, cfg["balance_path"], {cfg["key_param"]: cfg["key"]})
        if str(body.get(cfg["response_code_key"])) != cfg["success_code"]:
            raise UpstreamError(body.get(cfg["response_message_key"]) or "查询余额失败")
        return str(body.get(cfg["response_data_key"], ""))

    def accounts(self, config: dict[str, Any], account_type: str, quantity: int) -> list[dict]:
        cfg = self._config(config)
        body = self._read(
            cfg,
            cfg["account_path"],
            {
                cfg["key_param"]: cfg["key"],
                cfg["type_param"]: account_type,
                cfg["quantity_param"]: quantity,
            },
        )
        if str(body.get(cfg["response_code_key"])) != cfg["success_code"]:
            raise UpstreamError(body.get(cfg["response_message_key"]) or "获取账号失败")
        data = str(body.get(cfg["response_data_key"], ""))
        return _parse_accounts_blob(data, cfg["account_separator"])

    def history(self, config: dict[str, Any], account_type: str) -> str:
        cfg = self._config(config)
        body = self._read(
            cfg,
            cfg["history_path"],
            {cfg["key_param"]: cfg["key"], cfg["type_param"]: account_type},
        )
        if str(body.get(cfg["response_code_key"])) != cfg["success_code"]:
            raise UpstreamError(body.get(cfg["response_message_key"]) or "查询历史失败")
        return str(body.get(cfg["response_data_key"], ""))
