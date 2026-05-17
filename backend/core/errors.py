# -*- coding: utf-8 -*-
"""统一异常类型。

服务层抛出语义化异常；API 层只关心响应码：
  ValidationError      → 400
  NotAvailableError    → 501
  UpstreamError        → 502
  OpenMailError        → 500
"""


class OpenMailError(Exception):
    """所有自定义异常的基类。"""
    status_code = 500


class ValidationError(OpenMailError):
    """输入参数无效。"""
    status_code = 400


class NotFoundError(OpenMailError):
    """资源不存在。"""
    status_code = 404


class NotAvailableError(OpenMailError):
    """功能预留中。"""
    status_code = 501


class UpstreamError(OpenMailError):
    """上游 API（账号鸭 / Microsoft Graph / Gmail 等）失败。"""
    status_code = 502
