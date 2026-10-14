import os
import sys

# Ensure backend root and api directories are available on sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(api_dir)

for path in [backend_dir, api_dir, os.getcwd()]:
    if path and path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app
    handler = app
except Exception as e:
    import traceback
    tb = traceback.format_exc()
    import logging
    logging.error(f"FATAL BACKEND STARTUP ERROR: {tb}")

    async def handler(scope, receive, send):
        if scope["type"] == "http":
            response_body = f"STARTUP ERROR:\n{tb}".encode("utf-8")
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
