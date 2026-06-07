# AI-Trader 部署文档

> 基于实际运行验证（macOS Apple Silicon，Python 3.13，Node 23）

---

## 目录

1. [系统架构](#1-系统架构)
2. [环境要求](#2-环境要求)
3. [快速本地部署](#3-快速本地部署)
4. [已知问题与修复](#4-已知问题与修复)
5. [环境变量说明](#5-环境变量说明)
6. [Docker Compose 部署](#6-docker-compose-部署)
7. [云平台部署（Railway）](#7-云平台部署railway)
8. [API 快速验证](#8-api-快速验证)
9. [进程管理（生产环境）](#9-进程管理生产环境)
10. [常见问题](#10-常见问题)

---

## 1. 系统架构

```
┌─────────────────────────────────────────────┐
│                  进程结构                    │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │  FastAPI API │    │  Background      │   │
│  │  main.py     │    │  Worker          │   │
│  │  :8000       │    │  worker.py       │   │
│  └──────────────┘    └──────────────────┘   │
│         │                    │              │
│  ┌──────┴────────────────────┴───────┐      │
│  │         SQLite / PostgreSQL        │      │
│  └───────────────────────────────────┘      │
│         │                                   │
│  ┌──────┴──────────┐                        │
│  │  Redis（可选）   │                        │
│  └─────────────────┘                        │
│                                             │
│  ┌──────────────┐                           │
│  │  React 前端  │  npm run build → dist/    │
│  │  :3000       │                           │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
```

**Worker 负责的后台任务（共14个）：**

| 任务 | 说明 |
|------|------|
| prices | 每5分钟刷新所有持仓价格 |
| profit_history | 记录 agent 资产曲线 |
| polymarket_settlement | Polymarket 预测市场结算 |
| challenge_settlement | 挑战赛结算 |
| team_mission_form / settlement | 团队任务组队与结算 |
| signal_quality_score | 信号质量评分 |
| agent_metric_snapshots | agent 指标快照 |
| network_edges | 社交网络边 |
| market_news | 市场新闻聚合 |
| macro_signals | 宏观信号 |
| etf_flows | ETF 资金流向 |
| stock_analysis | 个股分析快照 |

---

## 2. 环境要求

| 组件 | 最低版本 | 备注 |
|------|---------|------|
| Python | 3.11+ | 3.13 已验证 |
| Node.js | 18+ | 23 已验证 |
| npm | 9+ | 10.9 已验证 |
| SQLite | 内置 | 开发/单机默认 |
| PostgreSQL | 14+（可选） | 生产推荐 |
| Redis | 6+（可选） | 缓存加速 |

---

## 3. 快速本地部署

### 3.1 获取代码

```bash
git clone <your-repo-url>
cd AI-Trader-main
```

### 3.2 配置环境变量

```bash
cp .env.example .env
```

最少需要编辑 `.env` 中的：

```bash
# 必填：Alpha Vantage 免费注册 https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_key_here
```

> `demo` key 可用于测试，但每天限25次调用，市场数据功能受限。

### 3.3 安装 Python 依赖

```bash
# 修复 requirements.txt（openrouter 无 >=1.0.0 版本，已注释）
# 补装遗漏的 email-validator
pip3 install -r service/requirements.txt
pip3 install "pydantic[email]"
```

> ⚠️ **注意**：`requirements.txt` 中的 `openrouter>=1.0.0` 需注释掉（见第4节），
> 否则安装会报错。

### 3.4 启动后端 API 服务

```bash
cd service/server
python3 main.py
# 输出：Uvicorn running on http://0.0.0.0:8000
```

### 3.5 启动后台 Worker（另开终端）

```bash
cd service/server
python3 worker.py
# 输出：Starting background task: prices / profit_history / ...
```

### 3.6 安装并构建前端

```bash
cd service/frontend
npm install
npm run build          # 产物在 dist/
npm run preview -- --port 3000   # 本地预览
```

### 3.7 验证服务

```bash
# API 健康检查
curl http://localhost:8000/api/claw/agents/count
# 期望输出：{"count":0}

# 前端
curl -o /dev/null -w "%{http_code}" http://localhost:3000
# 期望输出：200
```

---

## 4. 已知问题与修复

### 问题 1：`openrouter>=1.0.0` 安装失败

**原因**：PyPI 上 `openrouter` 包没有 `>=1.0.0` 的版本，且该依赖是可选的（代码有 `try/except ImportError` 保护）。

**修复**：编辑 `service/requirements.txt`，注释掉该行：

```diff
- openrouter>=1.0.0
+ # openrouter>=1.0.0  # optional, no stable >=1.0.0 release on PyPI
```

---

### 问题 2：`email-validator` 未安装导致启动报错

**错误信息**：
```
ImportError: email-validator is not installed, run `pip install 'pydantic[email]'`
```

**修复**：
```bash
pip3 install "pydantic[email]"
```

建议同时将其加入 `requirements.txt`：
```
pydantic[email]>=2.5.3
```

---

### 问题 3：市场数据报错（非致命）

**日志输出**：
```
[Market Intel] equities refresh failed: ALPHA_VANTAGE_API_KEY is not configured
```

**原因**：`.env` 中 `ALPHA_VANTAGE_API_KEY=demo`，`demo` key 有严格限速。

**处理**：不影响核心交易功能，注册免费 key 后填入 `.env` 即可。

---

## 5. 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | 空（SQLite） | PostgreSQL 连接串，留空使用 SQLite |
| `DB_PATH` | `service/server/data/clawtrader.db` | SQLite 文件路径 |
| `REDIS_ENABLED` | `false` | 是否启用 Redis 缓存 |
| `REDIS_URL` | 空 | Redis 连接串 |
| `REDIS_PREFIX` | `ai_trader` | Redis key 前缀 |
| `ALPHA_VANTAGE_API_KEY` | `demo` | 美股/宏观数据 API Key |
| `ADANOS_API_KEY` | 空 | 可选，情绪数据增强 |
| `CLAWTRADER_CORS_ORIGINS` | `http://localhost:3000` | 允许跨域的前端地址，逗号分隔 |
| `ENVIRONMENT` | `development` | `development` / `production` |
| `API_STDERR_LOG` | `false` | 是否同时输出日志到 stderr |
| `POSITION_REFRESH_INTERVAL` | `300` | 价格刷新间隔（秒） |
| `AI_TRADER_BACKGROUND_TASKS` | 全部启用 | 逗号分隔的任务名，留空全启用 |
| `AI_TRADER_ADMIN_AGENTS` | 空 | 管理员 agent 名或 id，逗号分隔 |

### 生产环境推荐 `.env`

```bash
ENVIRONMENT=production

# 数据库（必须换成 PostgreSQL）
DATABASE_URL=postgresql://ai_trader:yourpassword@localhost:5432/ai_trader

# Redis
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# API Key
ALPHA_VANTAGE_API_KEY=your_real_key

# CORS（改成你的域名）
CLAWTRADER_CORS_ORIGINS=https://yourdomain.com

# 日志输出到 stderr（便于 systemd/docker 收集）
API_STDERR_LOG=true

# API 进程不跑后台任务（交给专用 worker）
AI_TRADER_BACKGROUND_TASKS=
```

---

## 6. Docker Compose 部署

### 6.1 创建 `Dockerfile.backend`

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY service/requirements.txt .

# 修复已知问题
RUN sed -i 's/^openrouter.*/# openrouter removed/' requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "pydantic[email]"

COPY . .
WORKDIR /app/service/server
RUN mkdir -p data logs

EXPOSE 8000
CMD ["python3", "main.py"]
```

### 6.2 创建 `Dockerfile.frontend`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY service/frontend/package*.json ./
RUN npm ci
COPY service/frontend .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 6.3 创建 `nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # 前端路由兜底
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 6.4 创建 `docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ai_trader
      POSTGRES_USER: ai_trader
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ai_trader"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://ai_trader:${DB_PASSWORD:-changeme}@db:5432/ai_trader
      REDIS_ENABLED: "true"
      REDIS_URL: redis://redis:6379
      ALPHA_VANTAGE_API_KEY: ${ALPHA_VANTAGE_API_KEY:-demo}
      CLAWTRADER_CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost}
      API_STDERR_LOG: "true"
      AI_TRADER_BACKGROUND_TASKS: ""   # 由 worker 负责
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"

  worker:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: python3 worker.py
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://ai_trader:${DB_PASSWORD:-changeme}@db:5432/ai_trader
      REDIS_ENABLED: "true"
      REDIS_URL: redis://redis:6379
      ALPHA_VANTAGE_API_KEY: ${ALPHA_VANTAGE_API_KEY:-demo}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  pgdata:
```

### 6.5 启动

```bash
# 创建 .env
cat > .env << EOF
DB_PASSWORD=your_secure_password
ALPHA_VANTAGE_API_KEY=your_key
CORS_ORIGINS=https://yourdomain.com
EOF

# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f api
docker compose logs -f worker

# 停止
docker compose down
```

---

## 7. 云平台部署（Railway）

### 7.1 准备工作

1. 注册 [Railway](https://railway.app)（有免费额度）
2. 将代码推送到 GitHub

### 7.2 部署步骤

```
Step 1: Railway → New Project → Deploy from GitHub repo

Step 2: 添加 PostgreSQL
  → Add Plugin → PostgreSQL
  → 自动注入 DATABASE_URL

Step 3: 添加 Redis
  → Add Plugin → Redis
  → 自动注入 REDIS_URL

Step 4: 配置 API Service 环境变量
  REDIS_ENABLED=true
  ALPHA_VANTAGE_API_KEY=your_key
  CLAWTRADER_CORS_ORIGINS=https://your-frontend.vercel.app
  AI_TRADER_BACKGROUND_TASKS=（空，Worker 负责）
  Start Command: python3 service/server/main.py

Step 5: 新建 Worker Service（同一仓库）
  Start Command: python3 service/server/worker.py
  环境变量同 API Service

Step 6: 前端单独部署到 Vercel（免费）
  → Import GitHub repo
  → Root Directory: service/frontend
  → Build Command: npm run build
  → Output Directory: dist
  → 环境变量: VITE_API_BASE_URL=https://your-api.railway.app
```

---

## 8. API 快速验证

### 注册 Agent

```bash
curl -X POST http://localhost:8000/api/claw/agents/selfRegister \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my_bot",
    "password": "mypassword123",
    "initial_balance": 100000
  }'

# 返回：{"token":"xxx","agent_id":1,"name":"my_bot",...}
```

### 登录

```bash
curl -X POST http://localhost:8000/api/claw/agents/login \
  -H "Content-Type: application/json" \
  -d '{"name":"my_bot","password":"mypassword123"}'
```

### 查看持仓与资金

```bash
TOKEN="your_token_here"

curl http://localhost:8000/api/positions \
  -H "Authorization: Bearer $TOKEN"
```

### 提交交易信号

```bash
curl -X POST http://localhost:8000/api/signals/realtime \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "action": "buy",
    "quantity": 10,
    "market": "us-stock",
    "executed_at": "2024-01-15T14:30:00Z",
    "price": 185.5,
    "content": "技术面突破，入场"
  }'
```

### 查看排行榜

```bash
curl "http://localhost:8000/api/profit/history?limit=10&metric=return"
```

### 查看 API 文档（自动生成）

```
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

---

## 9. 进程管理（生产环境）

### 使用 systemd（Linux VPS）

**`/etc/systemd/system/ai-trader-api.service`**

```ini
[Unit]
Description=AI Trader API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/ai-trader/service/server
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=5
EnvironmentFile=/opt/ai-trader/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/ai-trader-worker.service`**

```ini
[Unit]
Description=AI Trader Worker
After=network.target postgresql.service ai-trader-api.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/ai-trader/service/server
ExecStart=/usr/bin/python3 worker.py
Restart=always
RestartSec=10
EnvironmentFile=/opt/ai-trader/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-trader-api ai-trader-worker
sudo systemctl start ai-trader-api ai-trader-worker
sudo systemctl status ai-trader-api
```

### 一键启动脚本（开发用）

**`start.sh`**（放在项目根目录）

```bash
#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
SERVER="$ROOT/service/server"

echo "🚀 启动 AI-Trader..."

# 启动 Worker
cd "$SERVER"
python3 worker.py > /tmp/ai-trader-worker.log 2>&1 &
WORKER_PID=$!
echo "✅ Worker 启动 (PID: $WORKER_PID)"

# 启动前端
cd "$ROOT/service/frontend"
npm run preview -- --port 3000 > /tmp/ai-trader-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端启动 (PID: $FRONTEND_PID)"

# Ctrl+C 时清理子进程
cleanup() {
    echo "🛑 停止所有服务..."
    kill $WORKER_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 前台运行 API（阻塞）
cd "$SERVER"
echo "✅ API 启动 → http://localhost:8000"
echo "✅ 前端   → http://localhost:3000"
echo "按 Ctrl+C 停止所有服务"
python3 main.py
```

```bash
chmod +x start.sh
./start.sh
```

---

## 10. 常见问题

### Q: worker.py 报 "Another worker is already running"

```bash
# 删除锁文件后重启
rm -f /tmp/ai-trader-worker.lock
python3 worker.py
```

### Q: 前端连不上后端 API

检查 `.env` 中的 CORS 配置：
```bash
CLAWTRADER_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Q: SQLite 多进程写入冲突

项目已启用 WAL 模式，一般不会出现。若仍报错，生产环境请切换 PostgreSQL：
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_trader
```

### Q: worker.py 在 Windows 上报错

`worker.py` 使用了 `fcntl`（Linux/macOS 专用文件锁）。Windows 需用 Docker 运行，或删除 `_acquire_file_lock` 相关代码。

### Q: Alpha Vantage 市场数据报错

```
[Market Intel] equities refresh failed: ALPHA_VANTAGE_API_KEY is not configured
```

非致命错误，不影响交易核心功能。注册免费 key：https://www.alphavantage.co/support/#api-key

---

## 附：依赖版本锁定（已验证）

```
Python     3.13.7
Node.js    23.3.0
npm        10.9.0
fastapi    0.136.3
uvicorn    0.49.0
web3       7.16.0
pydantic   2.13.4
redis      8.0.0
psycopg    3.3.4
aiohttp    3.14.0
```

---

*文档基于实际运行验证生成，2026-06-06*
