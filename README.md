# OpenMail Mail Console

一个小型 Flask + Vue 工具，用于账号鸭协议接入、自定义 API 请求渠道、历史记录查询，以及通过 OAuth2 / IMAP 读取邮箱邮件。后端提供账号源、邮件读取和工具 API，前端是构建到 `static/dist` 的单页应用。

## 功能

- 配置账号鸭协议或自定义 API 请求渠道，调用账号购买/历史/余额接口。
- 支持购买账号、查询购买历史，并兼容 `----` 与冒号分隔的账号/历史格式。
- 使用 Microsoft / Google OAuth2 refresh token 获取 access token。
- 通过 Microsoft Graph、Gmail REST API 或标准 IMAP 读取邮件。
- 提供 Vue 前端界面和 Flask API。

## 目录结构

```text
.
├── app.py                  # Flask 入口，暴露 app:app
├── backend/                # Flask 应用工厂、配置、API、服务层
├── frontend/               # Vue/Vite 前端源码
├── static/dist/            # 前端构建产物，由 npm run build 生成
├── templates/              # 未构建前端时的 Flask 模板回退
├── account_api.py          # 账号 API 兼容封装
├── mail_reader.py          # Microsoft OAuth2 / Graph 邮件读取
├── requirements.txt        # Python 依赖
├── Dockerfile              # 生产镜像构建
├── docker-compose.yml      # Compose 部署示例
└── .dockerignore           # Docker 构建上下文排除规则
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `APP_SECRET_KEY` | `dev-only-change-me` | Flask session secret，生产环境必须改成随机长字符串。 |
| `DEFAULT_API_BASE_URL` | 空 | 默认账号 API 服务地址，会暴露给前端作为默认值。 |
| `OPENMAIL_HTTP_TIMEOUT` | `30` | 后端请求外部 API 的超时时间，单位秒。 |
| `FLASK_DEBUG` | `1` | Flask 调试开关；生产环境应设为 `0`。 |
| `HOST` | `127.0.0.1` | 本地开发服务器监听地址，仅 `python app.py` 使用。 |
| `PORT` | `5000` | 本地开发服务器监听端口，仅 `python app.py` 使用。 |

可以复制 `.env.example` 为 `.env` 后本地填写：

```powershell
Copy-Item .env.example .env
```

不要把 `.env` 或真实 token、账号、密码、API key 提交到代码库。

## Python 本地运行

```powershell
pip install -r requirements.txt
python app.py
```

默认访问地址：

```text
http://127.0.0.1:5000
```

本地 `python app.py` 会使用 Flask 开发服务器。生产部署请使用 Docker 或 WSGI 服务器。

## 前端构建

前端源码在 `frontend/`，构建产物输出到根目录的 `static/dist/`，Flask 会优先读取该目录下的 `index.html`。

```powershell
Set-Location frontend
npm install
npm run build
Set-Location ..
```

开发前端时可以运行：

```powershell
Set-Location frontend
npm run dev
```

Vite 开发服务器默认使用 `5173` 端口，并把 `/api` 代理到 `http://localhost:5000`。

## Docker GitHub Actions

仓库已添加 `.github/workflows/docker-image.yml`：

- `push` 到 `main` / `master` 会构建并推送镜像到 GHCR
- `pull_request` 只做构建验证，不推送
- `tag v*.*.*` 会同时打版本标签
- 镜像名：`ghcr.io/<owner>/openmaill`

如果你想改成 Docker Hub，我也可以再给你换一版。

## Docker 部署

构建镜像：

```powershell
docker build -t openmail-account-console .
```

运行容器：

```powershell
docker run --rm -p 5000:5000 `
  -e APP_SECRET_KEY="change-this-to-a-long-random-string" `
  -e FLASK_DEBUG=0 `
  openmail-account-console
```

镜像构建会在 Node 阶段执行前端构建，再在 Python 运行阶段通过 Gunicorn 启动 Flask：

```text
gunicorn --bind 0.0.0.0:5000 app:app
```

## Docker Compose 部署

复制环境变量文件：

```powershell
Copy-Item .env.example .env
```

编辑 `.env` 后启动：

```powershell
docker compose up --build -d
```

查看日志：

```powershell
docker compose logs -f web
```

停止服务：

```powershell
docker compose down
```

Compose 默认把容器 `5000` 端口映射到主机 `5000` 端口。

## 安全注意事项

- 生产环境必须设置强随机 `APP_SECRET_KEY`，并设置 `FLASK_DEBUG=0`。
- 不要提交 `.env`、真实 API key、refresh token、access token、邮箱密码或账号样例。
- API Key 仅由用户在浏览器中填写并保存到 localStorage，后端不提供、不持久化，也不会通过环境变量下发。
- 外部账号 API、Microsoft OAuth2 和 Graph 调用都依赖真实网络和凭据，测试时建议使用隔离账号或 mock 请求。
- Docker 构建上下文通过 `.dockerignore` 排除了 `.env`、`node_modules`、`output`、缓存和日志，避免敏感信息或无关产物进入镜像。
