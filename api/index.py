import os
import sys

# Ensure backend directory is in Python path for Vercel Serverless Function
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the main FastAPI application instance
from app.main import app
