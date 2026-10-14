import sys
from pathlib import Path

# Ensure backend directory is in sys.path so app packages are resolvable in serverless
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app

# Expose app for Vercel Python runtime
app = app
