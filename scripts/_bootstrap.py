"""Auto-configure sys.path so scripts can import service/server modules."""
import os
import sys
from pathlib import Path

_ROOT = Path(__file__).parent.parent.resolve()
_SERVER = _ROOT / "service" / "server"

for _p in (_SERVER,):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

# Ensure DB_PATH is not set to a relative string — let database.py derive it
# from __file__ (which produces the correct absolute path under service/server/data/).
if not os.environ.get("DB_PATH"):
    os.environ.pop("DB_PATH", None)  # clear any empty string so default logic kicks in
