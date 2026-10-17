import os
import sys

# Ensure backend root is on sys.path for Vercel Python Serverless (@vercel/python)
api_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(api_dir)

for path in [backend_dir, api_dir, os.getcwd()]:
    if path and path not in sys.path:
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
