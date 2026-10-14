import os
import sys

# Ensure backend root and app directories are available on sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(api_dir)
backend_dir = os.path.join(repo_root, "backend")

for path in [backend_dir, os.path.join(backend_dir, "app"), repo_root, api_dir]:
    if path and os.path.exists(path) and path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
    handler = app
except Exception as e:
    import traceback
    tb = traceback.format_exc()
    import logging
    logging.error(f"FATAL STARTUP ERROR: {tb}")

    async def handler(scope, receive, send):
        if scope["type"] == "http":
            response_body = f"BACKEND STARTUP ERROR:\n{tb}".encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"text/plain; charset=utf-8"),
                    (b"access-control-allow-origin", b"*"),
                    (b"access-control-allow-methods", b"*"),
                    (b"access-control-allow-headers", b"*"),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": response_body,
            })
