import os
import json
from typing import Dict, Any

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'templates')


def load_mission_template(name: str) -> Dict[str, Any]:
    """Load a mission template by name from the templates directory."""
    filename = f"mission_{name}.json"
    path = os.path.join(TEMPLATE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Template '{name}' not found at {path}")
    with open(path, 'r') as f:
        return json.load(f) 