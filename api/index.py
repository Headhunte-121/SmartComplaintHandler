import os
import sys

# Ensure backend root and app directories are available on sys.path for Vercel Python Serverless (@vercel/python)
api_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(api_dir)
backend_dir = os.path.join(repo_root, "backend")

for path in [backend_dir, os.path.join(backend_dir, "app"), repo_root, api_dir, os.getcwd()]:
    if path and os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
except Exception as e:
    import traceback
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    app = FastAPI(title="Diagnostic Startup Fallback")

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    def error_fallback(path: str = ""):
        return PlainTextResponse(f"BACKEND COLD START ERROR:\n{tb}", status_code=500)

__all__ = ["app"]
