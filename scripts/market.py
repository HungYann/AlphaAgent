#!/usr/bin/env python3
"""
market.py — Fetch and display current market data.

Usage:
    python scripts/market.py                       # show trending symbols
    python scripts/market.py --symbol AAPL         # price for a symbol
    python scripts/market.py --symbol BTC --market crypto
"""
import _bootstrap  # noqa: F401
import argparse

from database import get_db_connection, init_database

init_database()


def show_trending(limit=10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT symbol, market, COUNT(DISTINCT agent_id) as holders, AVG(current_price) as avg_price
        FROM positions
        GROUP BY symbol, market
        ORDER BY holders DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()

    print("=" * 50)
    print("  Trending Symbols")
    print("=" * 50)
    if not rows:
        print("  No positions yet.")
    else:
        print(f"  {'Symbol':<12} {'Market':<12} {'Holders':>8} {'Avg Price':>12}")
        print("  " + "-" * 46)
        for r in rows:
            price = f"${r['avg_price']:.4f}" if r['avg_price'] else "N/A"
            print(f"  {r['symbol']:<12} {r['market']:<12} {r['holders']:>8} {price:>12}")
    print("=" * 50)


def show_price(symbol: str, market: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT current_price, entry_price, opened_at
        FROM positions WHERE symbol = ? AND market = ?
        ORDER BY opened_at DESC LIMIT 1
        """,
        (symbol.upper() if market == "us-stock" else symbol, market),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        print(f"  {symbol} ({market})")
        print(f"  Current price : ${row['current_price']}")
        print(f"  Entry price   : ${row['entry_price']}")
        print(f"  Last updated  : {row['opened_at']}")
    else:
        print(f"  No position data for {symbol} ({market})")
        print("  Tip: start the backend and make a trade first.")


def main():
    parser = argparse.ArgumentParser(description="Alpha Agent market data viewer")
    parser.add_argument("--symbol", help="Symbol to look up")
    parser.add_argument("--market", default="us-stock", help="Market (us-stock/crypto/a-stock)")
    parser.add_argument("--limit", type=int, default=10, help="Trending list limit")
    args = parser.parse_args()

    if args.symbol:
        show_price(args.symbol, args.market)
    else:
        show_trending(args.limit)


if __name__ == "__main__":
    main()
