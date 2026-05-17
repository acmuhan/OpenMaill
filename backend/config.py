# -*- coding: utf-8 -*-
"""集中配置，所有可调参数从环境变量读取。"""
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Config:
    SECRET_KEY = os.getenv("APP_SECRET_KEY", "dev-only-change-me")

    # 默认账号源（前端通过 window.APP_DEFAULTS 读取）
    DEFAULT_API_BASE_URL = os.getenv("DEFAULT_API_BASE_URL", "").strip().rstrip("/")
    DEFAULT_API_KEY = os.getenv("DEFAULT_API_KEY", "").strip()

    # 请求超时（秒）
    HTTP_TIMEOUT = int(os.getenv("OPENMAIL_HTTP_TIMEOUT", "30"))

    # 调试日志
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    @classmethod
    def public_defaults(cls):
        """返回可以暴露给前端的默认值。"""
        return {
            "base_url": cls.DEFAULT_API_BASE_URL,
            "key": cls.DEFAULT_API_KEY,
        }
