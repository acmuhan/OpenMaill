# -*- coding: utf-8 -*-
"""Concrete account tools."""
from typing import Any

from account_api import get_accounts, get_balance, get_history
from backend.core.errors import UpstreamError
from backend.tools.base import AccountTool, ToolDefinition


class ZhanghaoyaAccountTool(AccountTool):
    definition = ToolDefinition(
        id="zhanghaoya",
        name="账号鸭",
        category="account",
        vendor="zhanghaoya",
        description="兼容 /store/ga/* 的账号购买、余额和历史接口。",
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
        description="自定义兼容账号鸭协议的账号源。",
        fields=ZhanghaoyaAccountTool.definition.fields,
    )
