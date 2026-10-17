import os
import sys

# Ensure backend root is on sys.path for Vercel Python Serverless (@vercel/python)
api_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(api_dir)

for path in [backend_dir, api_dir, os.getcwd()]:
    if path and path not in sys.path:
        sys.path.insert(0, path)

import app.main

app = app.main.app
application = app

__all__ = ["app", "application"]
