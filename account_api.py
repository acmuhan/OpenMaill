# -*- coding: utf-8 -*-
import requests


def _req(base_url, path, params, timeout=30):
    url = base_url.rstrip("/") + path
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def get_accounts(base_url, key, account_type="hotmail", quantity=1):
    data = _req(base_url, "/store/ga/account", {"type": account_type, "quantity": quantity, "key": key})
    if data.get("Code") != 200:
        raise RuntimeError(f"获取账号失败: {data.get('Message')}")
    accounts = []
    for line in data["Data"].split("\r\n<br>"):
        line = line.strip()
        if ":" in line:
            email, password = line.split(":", 1)
            accounts.append({"email": email.strip(), "password": password.strip()})
    return accounts


def get_balance(base_url, key):
    data = _req(base_url, "/store/ga/balance", {"key": key})
    if data.get("Code") != 200:
        raise RuntimeError(f"查询余额失败: {data.get('Message')}")
    return data["Data"]


def get_history(base_url, key, account_type="hotmail"):
    data = _req(base_url, "/store/ga/history", {"type": account_type, "key": key})
    if data.get("Code") != 200:
        raise RuntimeError(f"查询历史失败: {data.get('Message')}")
    return data["Data"]
