# -*- coding: utf-8 -*-
"""Tool 抽象基类。

后端 Tool 模型与前端的 ToolDefinition 一一对应，但行为更具体：
  - AccountTool：账号源（账号鸭、自定义）
  - MailTool：邮件协议（Outlook / Gmail / IMAP）

每个具体 Tool 类提供：
  - definition  : ToolDefinition 元数据（向前端公开）
  - 一组同步方法 ：业务调用入口（balance / accounts / token / emails / ...）
"""
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class ToolDefinition:
    id: str
    name: str
    category: str
    description: str = ""
    vendor: str = ""
    available: bool = True
    fields: list = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


class BaseTool(ABC):
    """所有 Tool 的根基类。"""

    definition: ToolDefinition

    @property
    def id(self) -> str:
        return self.definition.id

    @property
    def available(self) -> bool:
        return self.definition.available

    def to_dict(self) -> dict:
        return self.definition.to_dict()


class AccountTool(BaseTool):
    """账号 API 抽象。
    config 至少包含 base_url / key（账号鸭兼容协议）。
    """

    @abstractmethod
    def balance(self, config: dict[str, Any]) -> str: ...

    @abstractmethod
    def accounts(self, config: dict[str, Any], account_type: str, quantity: int) -> list[dict]: ...

    @abstractmethod
    def history(self, config: dict[str, Any], account_type: str) -> str: ...


class MailTool(BaseTool):
    """邮件协议抽象。
    config 至少包含 email；具体字段由各 Tool 定义。
    """

    @abstractmethod
    def token(self, config: dict[str, Any]) -> dict: ...

    @abstractmethod
    def emails(self, config: dict[str, Any], access_token: str, folder: str, limit: int) -> list[dict]: ...

    @abstractmethod
    def email_body(self, config: dict[str, Any], access_token: str, mail_id: str) -> dict: ...
