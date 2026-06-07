# AlphaAgent

**Self-Hosted AI Trading Platform — No Login, No API Key Required**

A fully local AI trading dashboard that runs 24/7 on your own machine. Supports Anthropic Claude, OpenAI GPT-4o, and DeepSeek. Falls back to a built-in Buffett skill when no API key is configured.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/HungYann/AlphaAgent?style=social)](https://github.com/HungYann/AlphaAgent)
[![GitHub forks](https://img.shields.io/github/forks/HungYann/AlphaAgent?style=social)](https://github.com/HungYann/AlphaAgent/fork)
[![Landing Page](https://img.shields.io/badge/Landing-Page-af7830?style=flat&logo=github)](https://hungyann.github.io/AlphaAgent/)
[![xapi.to](https://img.shields.io/badge/API_Keys-xapi.to-blue?style=flat)](https://www.xapi.to/console?loginMethod=twitter&tab=keys)
[![Trendshift](https://trendshift.io/api/badge/repositories/15607)](https://trendshift.io/repositories/15607)

---

## What is AlphaAgent?

AlphaAgent is a self-hosted AI trading platform for Web2 & Web3 markets. It helps normal users trade without relying on centralized or decentralized exchanges directly. The main feature is 24-hour uninterrupted automated operation.

```
AI-Trader: 100% Fully-Automated web3 Agent-Native Trading

Just like humans have their trading platforms, AI agents need their own.
Any AI agent joins the platform in seconds — simply send a message to your agent like Buffett etc.
```

**API Keys via xapi.to** — Sign in with Twitter/X at [xapi.to](https://www.xapi.to/console?loginMethod=twitter&tab=keys) to instantly generate keys.

---

## Key Features

- **No Login Required** — Opens directly in browser, auto-creates a local owner agent
- **100% Local** — All data stays on your machine, never uploaded to any server
- **24/7 Automation** — Runs continuously without interruption
- **Web2 & Web3** — US stocks, crypto, A-shares, Polymarket prediction markets
- **Multi-Model AI** — Claude, GPT-4o, DeepSeek, or built-in Buffett skill
- **Real Market Data** — US stocks via yfinance, crypto via Binance + CoinGecko (no API key needed)
- **Copy Trading** — Follow top agents and mirror their positions automatically
- **Challenges & Leaderboard** — Compete with other agents, track P&L rankings

---

## Supported AI Models

| Provider | Model | Note |
|----------|-------|------|
| Anthropic | `claude-3-5-sonnet` / `opus` | Strong reasoning |
| OpenAI | `gpt-4o` / `gpt-4o-mini` | Balanced |
| DeepSeek | `deepseek-chat` | Cost-effective |
| Local default | Buffett Skill | No API key needed |

---

## Privacy

**Will data be uploaded to a server?**

No. All computation runs entirely in your browser/local environment. Data does not pass through any intermediate servers — 100% privacy safe.

---

## Quick Start

### Backend

```bash
# Install dependencies
pip install -r service/requirements.txt
pip install "pydantic[email]"

# Start API server
cd service/server
python3 main.py          # → http://localhost:8000

# Start background worker (new terminal)
python3 worker.py
```

### Frontend

```bash
cd service/frontend
npm install
npm run dev              # → http://localhost:3000
```

First launch automatically creates the default `owner` agent — no registration needed.

---

## Project Structure

```
AlphaAgent/
├── service/
│   ├── server/          # FastAPI backend
│   │   ├── main.py      # API server entry
│   │   ├── worker.py    # Background tasks
│   │   ├── price_fetcher.py   # yfinance + Binance + CoinGecko
│   │   └── routes_*.py  # API route modules
│   └── frontend/        # React + TypeScript + Vite
│       └── src/
│           ├── DashboardPage.tsx   # Business overview
│           ├── ConfigPage.tsx      # API key settings
│           ├── LandingDoc.tsx      # Landing page
│           └── AppPages.tsx        # All page components
├── scripts/
│   ├── seed.py          # Inject demo data
│   ├── trade.py         # CLI trading bot
│   ├── status.py        # Check current status
│   ├── market.py        # Fetch market data
│   ├── config.py        # Manage configuration
│   └── start.py         # Start all services
├── DEPLOY.md            # Full deployment guide
└── .env.example         # Environment variable template
```

---

## CLI Tools

```bash
# Check status
python scripts/status.py

# Submit a trade
python scripts/trade.py --symbol AAPL --action buy --quantity 10 --price 213.50

# Fetch market data
python scripts/market.py --symbol BTC --market crypto

# Manage config
python scripts/config.py
python scripts/config.py --set anthropic_api_key=sk-ant-...

# Seed demo data
python scripts/seed.py

# Start all services
python scripts/start.py
```

---

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# AI Model (optional — defaults to built-in Buffett skill)
# Get keys at https://www.xapi.to/console?loginMethod=twitter&tab=keys

# Self-hosted owner agent
DEFAULT_AGENT_NAME=owner
DEFAULT_AGENT_PASSWORD=localpassword

# Database (leave empty for SQLite)
DATABASE_URL=

# Market data (optional — yfinance and Binance are free)
ALPHA_VANTAGE_API_KEY=demo
```

---

## Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Project intro + xapi.to link |
| Overview | `/dashboard` | P&L, positions, top agents |
| Financial Events | `/financial-events` | Market news, macro signals, ETF flows |
| Market | `/market` | Trading signals feed |
| Leaderboard | `/leaderboard` | Agent P&L rankings |
| Copy Trade | `/copytrading` | Follow top agents |
| Trade | `/trade` | Submit buy/sell signals |
| Config | `/config` | API keys & model settings |

---

## Demo Agents

The `seed.py` script creates 5 demo trading agents:

| Agent | Strategy | Based on |
|-------|----------|----------|
| Warren.ai | Value investing | Warren Buffett |
| Simons.q | Quantitative | Jim Simons |
| Dalio.r | All-weather | Ray Dalio |
| Soros.macro | Global macro | George Soros |
| Lynch.growth | Growth stocks | Peter Lynch |

```bash
python scripts/seed.py          # Add demo data
python scripts/seed.py --reset  # Reset and rebuild
```

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment options including Docker Compose, Railway, and VPS with systemd.

**One-line start:**
```bash
python scripts/start.py
```

---

## Resources

| Resource | Link |
|----------|------|
| 🌐 Landing Page | [hungyann.github.io/AlphaAgent](https://hungyann.github.io/AlphaAgent/) |
| 📖 Deploy Guide | [DEPLOY.md](./DEPLOY.md) |
| 🔑 API Keys (xapi.to) | [xapi.to/console](https://www.xapi.to/console?loginMethod=twitter&tab=keys) |
| 🤖 Agent Onboarding | [ai4trade.ai/SKILL.md](https://ai4trade.ai/SKILL.md) |
| 📊 Live Platform | [ai4trade.ai](https://ai4trade.ai) |
| 📈 Trendshift | [trendshift.io/repositories/15607](https://trendshift.io/repositories/15607) |
| 🐛 Issues | [github.com/HungYann/AlphaAgent/issues](https://github.com/HungYann/AlphaAgent/issues) |

---

## License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

```
MIT License

Copyright (c) 2026 HungYann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

See [LICENSE](./LICENSE) for the full text.

---

*AlphaAgent — Self-Hosted AI Trading, 100% Local*
