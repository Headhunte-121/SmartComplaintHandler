import os
import sys

# Ensure backend root and app directories are available on sys.path for Vercel Python Serverless (@vercel/python)
api_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(api_dir)
backend_dir = os.path.join(repo_root, "backend")

for path in [backend_dir, os.path.join(backend_dir, "app"), repo_root, api_dir, os.getcwd()]:
    if path and os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

# Export `app` ONLY. Do NOT export `handler = app` because @vercel/python treats `handler`
# as a BaseHTTPRequestHandler class and crashes with TypeError on ASGI FastAPI instances!
from app.main import app

__all__ = ["app"]
