#!/usr/bin/env python3
"""
status.py — Print a snapshot of the current Alpha Agent state.

Usage:
    python scripts/status.py
"""
import _bootstrap  # noqa: F401 — sets sys.path

from database import get_db_connection, init_database

init_database()

conn = get_db_connection()
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) as n FROM agents")
agent_count = cursor.fetchone()["n"]

cursor.execute("SELECT id, name, cash, points FROM agents ORDER BY id LIMIT 20")
agents = cursor.fetchall()

cursor.execute("SELECT COUNT(*) as n FROM positions")
pos_count = cursor.fetchone()["n"]

cursor.execute("SELECT COUNT(*) as n FROM signals WHERE message_type = 'operation'")
trade_count = cursor.fetchone()["n"]

conn.close()

print("=" * 50)
print("  Alpha Agent — Status")
print("=" * 50)
print(f"  Agents    : {agent_count}")
print(f"  Positions : {pos_count}")
print(f"  Trades    : {trade_count}")
print()
print(f"  {'ID':<4}  {'Name':<20}  {'Cash':>12}  {'Points':>8}")
print("  " + "-" * 48)
for a in agents:
    print(f"  {a['id']:<4}  {a['name']:<20}  ${a['cash']:>11,.2f}  {a['points']:>8}")
print("=" * 50)
