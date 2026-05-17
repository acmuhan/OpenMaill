# -*- coding: utf-8 -*-
import re
import requests

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


def get_access_token(refresh_token, client_id):
    resp = requests.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        data={
            "client_id": client_id,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "scope": "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access",
        },
        timeout=30,
    )
    body = resp.json()
    if body.get("error"):
        desc = body.get("error_description", "")
        if "service abuse" in desc:
            raise RuntimeError("账号已被封禁")
        raise RuntimeError(f"获取 access_token 失败: {desc}")
    return {"access_token": body["access_token"], "refresh_token": body["refresh_token"]}


def _headers(access_token):
    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


_FOLDER_MAP = {
    "INBOX": "inbox", "inbox": "inbox",
    "Sent": "sentitems", "sentitems": "sentitems",
    "Drafts": "drafts", "drafts": "drafts",
    "Deleted": "deleteditems", "deleteditems": "deleteditems",
    "Junk": "junkemail", "junkemail": "junkemail",
}


def list_emails(username, access_token, folder="INBOX", limit=20):
    folder_id = _FOLDER_MAP.get(folder, folder)
    url = f"{GRAPH_BASE}/me/mailFolders/{folder_id}/messages"
    params = {
        "$top": limit,
        "$orderby": "receivedDateTime desc",
        "$select": "id,subject,from,receivedDateTime",
    }
    resp = requests.get(url, headers=_headers(access_token), params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"读取邮件失败: {resp.status_code} {resp.text[:300]}")
    return [
        {
            "id": m["id"],
            "subject": m.get("subject") or "(无主题)",
            "from": m.get("from", {}).get("emailAddress", {}).get("address", ""),
            "date": m.get("receivedDateTime", ""),
        }
        for m in resp.json().get("value", [])
    ]


def get_email_body(username, access_token, mail_id, folder="INBOX"):
    url = f"{GRAPH_BASE}/me/messages/{mail_id}"
    resp = requests.get(url, headers=_headers(access_token),
                        params={"$select": "subject,from,receivedDateTime,body"}, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"读取邮件正文失败: {resp.status_code} {resp.text[:300]}")
    m = resp.json()
    body_content = m.get("body", {}).get("content", "")
    if m.get("body", {}).get("contentType") == "html":
        body_content = re.sub(r"<[^>]+>", "", body_content)
        body_content = re.sub(r"\n{3,}", "\n\n", body_content).strip()
    return {
        "subject": m.get("subject") or "(无主题)",
        "from": m.get("from", {}).get("emailAddress", {}).get("address", ""),
        "date": m.get("receivedDateTime", ""),
        "body": body_content,
    }
