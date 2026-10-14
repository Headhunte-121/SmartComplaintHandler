import os
import sys

# Ensure backend root is on sys.path
api_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(api_dir)

for path in [backend_dir, api_dir, os.getcwd()]:
    if path and path not in sys.path:
        sys.path.insert(0, path)

from app.main import app

handler = app
