from typing import Dict, Any, Optional
from fastapi import APIRouter
from app.models.mission import Mission

router = APIRouter()

@router.post("/simulate")
async def simulate_mission_endpoint(
    mission: Mission,
    num_simulations: Optional[int] = 100
) -> Dict[str, Any]:
    results = run_comprehensive_simulation(mission, num_simulations)
    summary = results['simulation_summary']
    risk_analysis = results['risk_analysis']

    # --- Recommendation logic ---
    recommendation = None
    wp_ids = [wp.id for wp in mission.waypoints]
    failure_rates = summary['waypoint_failure_rates']
    if len(wp_ids) >= 5:
        wp3_id = wp_ids[2]
        wp5_id = wp_ids[4]
        if (failure_rates.get(wp3_id, 0) > 15) or (failure_rates.get(wp5_id, 0) > 15):
            recommendation = "Add backup route between WP3 and WP4"

    response = {
        **results,
        "recommendation": recommendation
    }
    return response 