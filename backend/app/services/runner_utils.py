import random
from typing import Dict

def random_failure_occurs(prob: float) -> bool:
    return random.random() < prob

def evaluate_failure_impact(severity: str) -> str:
    if severity == "high":
        return "aborted"
    return "continue"

def suggest_backup(failure_stats: Dict[str, int]) -> str:
    if "sensor_failure" in failure_stats:
        return "Consider redundant sensors at key waypoints."
    elif "gps_loss" in failure_stats:
        return "Add GPS stabilization fallback."
    return "Review mission planning for high-risk points." 