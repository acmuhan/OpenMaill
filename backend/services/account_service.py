# -*- coding: utf-8 -*-
"""Account business orchestration."""
from typing import Any

from backend.core.errors import ValidationError
from backend.tools.registry import tool_registry


def _account_config(body: dict[str, Any]) -> dict[str, Any]:
    base_url = str(body.get("base_url", "")).strip().rstrip("/")
    key = str(body.get("key", "")).strip()
    if not base_url:
        raise ValidationError("请填写 API 服务器地址")
    if not key:
        raise ValidationError("请填写 API Key")
    return {"base_url": base_url, "key": key}


class AccountService:
    def balance(self, body: dict[str, Any]) -> str:
        tool = tool_registry.account(body.get("tool", "zhanghaoya"))
        return tool.balance(_account_config(body))

    def accounts(self, body: dict[str, Any]) -> list[dict]:
        tool = tool_registry.account(body.get("tool", "zhanghaoya"))
        quantity = int(body.get("quantity", 1))
        if quantity < 1:
            raise ValidationError("数量必须大于 0")
        return tool.accounts(
            _account_config(body),
            account_type=str(body.get("type", "hotmail")).strip() or "hotmail",
            quantity=quantity,
        )

    def history(self, body: dict[str, Any]) -> str:
        tool = tool_registry.account(body.get("tool", "zhanghaoya"))
        return tool.history(
            _account_config(body),
            account_type=str(body.get("type", "hotmail")).strip() or "hotmail",
        )


account_service = AccountService()
