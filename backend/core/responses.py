# -*- coding: utf-8 -*-
"""统一 JSON 响应与 API 装饰器。

前端约定的响应结构：
  成功： { "ok": true, ...payload }
  失败： { "ok": false, "error": "<message>" }
"""
from functools import wraps
from flask import jsonify
from .errors import OpenMailError


def ok(**payload):
    """成功响应。所有附加字段平铺在响应根（兼容现有前端契约）。"""
    return jsonify({"ok": True, **payload})


def fail(message, status_code=400):
    """失败响应。"""
    response = jsonify({"ok": False, "error": str(message)})
    response.status_code = status_code
    return response


def api_route(fn):
    """统一异常 → 响应的装饰器。

    业务层只管抛 OpenMailError 子类，API 层自动转成对应的 HTTP 状态码。
    其他未知异常一律 500。
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except OpenMailError as e:
            return fail(e, e.status_code)
        except ValueError as e:
            return fail(e, 400)
        except KeyError as e:
            return fail(f"缺少参数：{e}", 400)
        except Exception as e:
            return fail(e, 500)

    return wrapper
