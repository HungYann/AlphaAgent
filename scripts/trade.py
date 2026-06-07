#!/usr/bin/env python3
"""
trade.py — Submit a trade signal from the command line.

Usage:
    python scripts/trade.py --symbol AAPL --action buy --quantity 10 --price 185.5
    python scripts/trade.py --symbol AAPL --action sell --quantity 10 --price 190.0 --market us-stock
    python scripts/trade.py --list   # list all positions
"""
import _bootstrap  # noqa: F401
import argparse
import os
import sys

from database import get_db_connection, init_database
from services import _update_position_from_signal

init_database()


def get_default_agent():
    agent_name = os.getenv("DEFAULT_AGENT_NAME", "owner")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, cash FROM agents WHERE name = ?", (agent_name,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def list_positions(agent_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT symbol, market, side, quantity, entry_price, current_price FROM positions WHERE agent_id = ?",
        (agent_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    print("=" * 60)
    print("  Current Positions")
    print("=" * 60)
    if not rows:
        print("  No open positions.")
    else:
        print(f"  {'Symbol':<12} {'Market':<10} {'Side':<6} {'Qty':>8} {'Entry':>10} {'Current':>10}")
        print("  " + "-" * 56)
        for r in rows:
            cp = f"${r['current_price']:.4f}" if r['current_price'] else "N/A"
            print(f"  {r['symbol']:<12} {r['market']:<10} {r['side']:<6} {r['quantity']:>8.2f} ${r['entry_price']:>9.4f} {cp:>10}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Alpha Agent trade submitter")
    parser.add_argument("--symbol", help="Ticker symbol")
    parser.add_argument("--action", choices=["buy", "sell", "short", "cover"])
    parser.add_argument("--quantity", type=float)
    parser.add_argument("--price", type=float)
    parser.add_argument("--market", default="us-stock", help="Market (us-stock/crypto/a-stock)")
    parser.add_argument("--list", action="store_true", help="List current positions")
    args = parser.parse_args()

    agent = get_default_agent()
    if not agent:
        print("Error: default agent not found. Start the backend first.")
        sys.exit(1)

    if args.list:
        list_positions(agent["id"])
        return

    if not all([args.symbol, args.action, args.quantity, args.price]):
        parser.print_help()
        sys.exit(1)

    symbol = args.symbol.upper() if args.market == "us-stock" else args.symbol
    trade_value = args.price * args.quantity
    fee = trade_value * 0.001

    if args.action in ("buy", "short") and agent["cash"] < trade_value + fee:
        print(f"Error: insufficient cash. Available: ${agent['cash']:.2f}, Required: ${trade_value + fee:.2f}")
        sys.exit(1)

    from datetime import datetime, timezone
    executed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _update_position_from_signal(
            agent["id"], symbol, args.market, args.action,
            args.quantity, args.price, executed_at, cursor=cursor,
        )
        if args.action in ("buy", "short"):
            cursor.execute("UPDATE agents SET cash = cash - ? WHERE id = ?", (trade_value + fee, agent["id"]))
        else:
            cursor.execute("UPDATE agents SET cash = cash + ? WHERE id = ?", (trade_value - fee, agent["id"]))
        conn.commit()
        print(f"Trade submitted: {args.action.upper()} {args.quantity} {symbol} @ ${args.price:.4f}")
        print(f"Fee: ${fee:.4f} | Agent cash remaining: ${agent['cash'] - (trade_value + fee if args.action in ('buy','short') else -(trade_value - fee)):.2f}")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
