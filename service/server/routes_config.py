"""
Config routes — read/write agent runtime configuration.
Stored in service/server/data/agent_config.json (gitignored).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

_CONFIG_PATH = Path(__file__).parent / "data" / "agent_config.json"
_DEFAULTS: dict[str, Any] = {
    "model_provider": "local",          # local | anthropic | openai | deepseek
    "anthropic_api_key": "",
    "openai_api_key": "",
    "deepseek_api_key": "",
    "model_name": "",                   # auto-selected per provider when empty
    "default_skill": "buffett",
    "trade_fee_rate": 0.001,
    "initial_capital": 100000.0,
    "price_refresh_interval": 300,
    "max_parallel_price_fetch": 5,
}


def _load() -> dict[str, Any]:
    if _CONFIG_PATH.exists():
        try:
            return {**_DEFAULTS, **json.loads(_CONFIG_PATH.read_text())}
        except Exception:
            pass
    return dict(_DEFAULTS)


def _save(cfg: dict[str, Any]) -> None:
    _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    _CONFIG_PATH.write_text(json.dumps(cfg, indent=2))


class ConfigUpdate(BaseModel):
    model_provider: str | None = None
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    deepseek_api_key: str | None = None
    model_name: str | None = None
    default_skill: str | None = None
    trade_fee_rate: float | None = None
    initial_capital: float | None = None
    price_refresh_interval: int | None = None
    max_parallel_price_fetch: int | None = None


def _redact(cfg: dict[str, Any]) -> dict[str, Any]:
    """Mask API key values so they are not exposed in full."""
    out = dict(cfg)
    for key in ("anthropic_api_key", "openai_api_key", "deepseek_api_key"):
        val = out.get(key, "")
        if val:
            out[key] = val[:6] + "***" + val[-2:] if len(val) > 8 else "***"
    return out


def register_config_routes(app: FastAPI) -> None:

    @app.get("/api/config")
    async def get_config():
        """Return current config (API keys partially redacted)."""
        cfg = _load()
        return {"config": _redact(cfg)}

    @app.get("/api/config/raw")
    async def get_config_raw():
        """Return config with full API keys (local use only)."""
        return {"config": _load()}

    @app.put("/api/config")
    async def update_config(body: ConfigUpdate):
        """Merge updates into the stored config."""
        cfg = _load()
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        cfg.update(updates)
        _save(cfg)
        return {"success": True, "config": _redact(cfg)}

    @app.post("/api/config/reset")
    async def reset_config():
        """Reset to factory defaults."""
        _save(dict(_DEFAULTS))
        return {"success": True, "config": _redact(dict(_DEFAULTS))}

    @app.get("/api/status")
    async def get_status():
        """Quick health-check for the dashboard."""
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as n FROM agents")
        agent_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) as n FROM positions")
        position_count = cursor.fetchone()["n"]
        cursor.execute("SELECT COUNT(*) as n FROM signals WHERE message_type = 'operation'")
        trade_count = cursor.fetchone()["n"]
        cursor.execute(
            "SELECT COALESCE(SUM(cash),0) as total FROM agents"
        )
        total_cash = float(cursor.fetchone()["total"] or 0)
        conn.close()

        cfg = _load()
        return {
            "status": "running",
            "agent_count": agent_count,
            "position_count": position_count,
            "trade_count": trade_count,
            "total_cash": total_cash,
            "model_provider": cfg.get("model_provider", "local"),
            "default_skill": cfg.get("default_skill", "buffett"),
        }
