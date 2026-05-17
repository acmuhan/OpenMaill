# OpenMail 后端包（企业级模块化）
"""
backend/
├── app.py           Flask 工厂
├── config.py        集中配置
├── core/            通用基础设施（响应、错误、日志）
├── tools/           Tool 抽象 + 注册表（账号源 / 邮件协议）
├── services/        业务编排
└── api/             蓝图（按业务域分文件）
"""
from backend.app import create_app

__all__ = ["create_app"]
