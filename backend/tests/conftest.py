import sys
import os

# Ensure backend root is on Python sys.path so tests can be run from any working directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
