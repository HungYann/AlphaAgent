#!/usr/bin/env python3
"""
start.py — Start the Alpha Agent backend (API + Worker) in a single command.

Usage:
    python scripts/start.py             # start API + worker
    python scripts/start.py --api-only  # only start the API server
    python scripts/start.py --worker-only
"""
import _bootstrap  # noqa: F401
import argparse
import os
import subprocess
import sys
from pathlib import Path

_SERVER = Path(__file__).parent.parent / "service" / "server"
_PYTHON = sys.executable


def run_api():
    print("Starting API server on http://0.0.0.0:8000 ...")
    return subprocess.Popen([_PYTHON, str(_SERVER / "main.py")], cwd=str(_SERVER))


def run_worker():
    print("Starting background worker ...")
    return subprocess.Popen([_PYTHON, str(_SERVER / "worker.py")], cwd=str(_SERVER))


def main():
    parser = argparse.ArgumentParser(description="Alpha Agent service launcher")
    parser.add_argument("--api-only", action="store_true")
    parser.add_argument("--worker-only", action="store_true")
    args = parser.parse_args()

    procs = []
    try:
        if not args.worker_only:
            procs.append(run_api())
        if not args.api_only:
            procs.append(run_worker())

        print(f"\nStarted {len(procs)} process(es). Press Ctrl+C to stop.\n")
        for p in procs:
            p.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        for p in procs:
            p.terminate()
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        print("Done.")


if __name__ == "__main__":
    main()
