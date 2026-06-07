#!/usr/bin/env python3
"""
config.py — View or update Alpha Agent configuration.

Usage:
    python scripts/config.py              # show current config
    python scripts/config.py --set key=value [key=value ...]
    python scripts/config.py --reset
"""
import _bootstrap  # noqa: F401
import argparse
import json
import sys
from pathlib import Path

_CONFIG_PATH = Path(__file__).parent.parent / "service" / "server" / "data" / "agent_config.json"
_DEFAULTS = {
    "model_provider": "local",
    "anthropic_api_key": "",
    "openai_api_key": "",
    "deepseek_api_key": "",
    "model_name": "",
    "default_skill": "buffett",
    "trade_fee_rate": 0.001,
    "initial_capital": 100000.0,
    "price_refresh_interval": 300,
    "max_parallel_price_fetch": 5,
}


def load():
    if _CONFIG_PATH.exists():
        try:
            return {**_DEFAULTS, **json.loads(_CONFIG_PATH.read_text())}
        except Exception:
            pass
    return dict(_DEFAULTS)


def save(cfg):
    _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    _CONFIG_PATH.write_text(json.dumps(cfg, indent=2))


def redact(val, key):
    if "api_key" in key and val:
        return val[:6] + "***" + val[-2:] if len(val) > 8 else "***"
    return val


def main():
    parser = argparse.ArgumentParser(description="Alpha Agent config manager")
    parser.add_argument("--set", nargs="+", metavar="KEY=VALUE", help="Set config values")
    parser.add_argument("--reset", action="store_true", help="Reset to defaults")
    args = parser.parse_args()

    if args.reset:
        save(dict(_DEFAULTS))
        print("Config reset to defaults.")
        return

    cfg = load()

    if args.set:
        for kv in args.set:
            if "=" not in kv:
                print(f"Invalid format: {kv!r}. Use KEY=VALUE")
                sys.exit(1)
            k, v = kv.split("=", 1)
            if k not in _DEFAULTS:
                print(f"Unknown key: {k!r}")
                sys.exit(1)
            # type coerce
            default_type = type(_DEFAULTS[k])
            cfg[k] = default_type(v) if default_type is not str else v
        save(cfg)
        print("Config updated.")

    print()
    print("=" * 44)
    print("  Alpha Agent Config")
    print("=" * 44)
    for k, v in cfg.items():
        display = redact(v, k)
        print(f"  {k:<30} {display}")
    print("=" * 44)


if __name__ == "__main__":
    main()
