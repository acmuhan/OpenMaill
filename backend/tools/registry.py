# -*- coding: utf-8 -*-
"""Tool registry."""
from backend.core.errors import NotFoundError
from backend.tools.account import CustomAccountTool, ZhanghaoyaAccountTool
from backend.tools.base import AccountTool, BaseTool, MailTool
from backend.tools.mail import GmailMailTool, ImapMailTool, OutlookMailTool


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.id] = tool

    def get(self, tool_id: str | None) -> BaseTool:
        key = tool_id or ""
        tool = self._tools.get(key)
        if not tool:
            raise NotFoundError(f"未知 Tool：{key}")
        return tool

    def account(self, tool_id: str | None) -> AccountTool:
        tool = self.get(tool_id)
        if not isinstance(tool, AccountTool):
            raise NotFoundError(f"不是账号 Tool：{tool_id}")
        return tool

    def mail(self, tool_id: str | None) -> MailTool:
        tool = self.get(tool_id)
        if not isinstance(tool, MailTool):
            raise NotFoundError(f"不是邮件 Tool：{tool_id}")
        return tool

    def to_list(self) -> list[dict]:
        return [tool.to_dict() for tool in self._tools.values()]


tool_registry = ToolRegistry()
for _tool in (
    ZhanghaoyaAccountTool(),
    CustomAccountTool(),
    OutlookMailTool(),
    GmailMailTool(),
    ImapMailTool(),
):
    tool_registry.register(_tool)
