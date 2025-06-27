from tinydb import TinyDB, Query
from typing import Dict, Any, List
from datetime import datetime
import os

# Ensure the db directory exists
os.makedirs('db', exist_ok=True)
DB_PATH = os.path.join('db', 'simulation_history.json')
db = TinyDB(DB_PATH)


def log_simulation_result(result: Dict[str, Any]) -> None:
    """Log a simulation result to the database."""
    entry = {
        'timestamp': datetime.utcnow().isoformat(),
        **result
    }
    db.insert(entry)


def get_simulation_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve the most recent simulation runs."""
    all_entries = db.all()
    # Sort by timestamp descending
    all_entries.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return all_entries[:limit] 