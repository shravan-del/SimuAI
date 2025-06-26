# backend/app/routes/simulate.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.schema import Mission
from app.services.simulate_runner import run_comprehensive_simulation, simulate_mission, get_simulation_summary
from pydantic import ValidationError
from app.services.db_service import get_simulation_history
from app.services.template_loader import load_mission_template
from app.services.export_service import generate_csv, generate_heatmap

router = APIRouter()

@router.post("/simulate")
async def simulate_mission_endpoint(
    mission: Mission,
    num_simulations: Optional[int] = 100
) -> Dict[str, Any]:
    """
    Simulate a mission and return success rate and failure summary.
    
    Args:
        mission: The mission to simulate
        num_simulations: Number of simulation runs (default: 100, max: 1000)
    
    Returns:
        Dictionary containing simulation results, success rate, and failure summary
    """
    try:
        # Validate simulation count
        if num_simulations <= 0:
            raise HTTPException(status_code=400, detail="Number of simulations must be positive")
        if num_simulations > 1000:
            raise HTTPException(status_code=400, detail="Maximum 1000 simulations allowed")
        
        # Run comprehensive simulation
        results = run_comprehensive_simulation(mission, num_simulations)
        
        # Extract key metrics for the response
        summary = results['simulation_summary']
        risk_analysis = results['risk_analysis']
        
        response = {
            "success": True,
            "simulation_config": {
                "total_simulations": summary['total_simulations'],
                "mission_name": mission.name,
                "waypoint_count": len(mission.waypoints),
                "failure_scenario_count": len(mission.failure_scenarios)
            },
            "success_rate": {
                "percentage": summary['success_rate_percentage'],
                "successful_runs": summary['successful_runs'],
                "failed_runs": summary['failed_runs']
            },
            "failure_summary": {
                "waypoint_failures": summary['waypoint_failure_counts'],
                "waypoint_failure_rates": summary['waypoint_failure_rates'],
                "most_common_failure_types": summary['most_common_failure_types'],
                "most_common_severities": summary['most_common_severities']
            },
            "risk_analysis": {
                "risk_level": risk_analysis['risk_level'],
                "total_risk_score": risk_analysis['total_risk_score'],
                "high_risk_waypoints": risk_analysis['high_risk_waypoints'],
                "waypoint_risks": risk_analysis['waypoint_risks']
            },
            "detailed_failures": results['detailed_failures'],
            "timestamp": results['timestamp']
        }
        
        return response
        
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.post("/simulate/quick")
async def quick_simulation_endpoint(
    mission: Mission,
    num_simulations: Optional[int] = 100
) -> Dict[str, Any]:
    """
    Quick simulation endpoint that returns only essential metrics.
    
    Args:
        mission: The mission to simulate
        num_simulations: Number of simulation runs (default: 100)
    
    Returns:
        Simplified response with just success rate and basic failure info
    """
    try:
        if num_simulations <= 0 or num_simulations > 1000:
            raise HTTPException(status_code=400, detail="Number of simulations must be between 1 and 1000")
        
        # Run basic simulation
        simulation_result = simulate_mission(mission, num_simulations)
        summary = get_simulation_summary(simulation_result)
        
        return {
            "success": True,
            "success_rate_percentage": summary['success_rate_percentage'],
            "failure_rate_percentage": summary['failure_rate_percentage'],
            "total_simulations": summary['total_simulations'],
            "waypoint_failure_counts": summary['waypoint_failure_counts'],
            "most_common_failure_types": summary['most_common_failure_types'][:3]  # Top 3
        }
        
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.get("/simulate/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for the simulation service.
    """
    return {
        "status": "healthy",
        "service": "mission-simulation",
        "version": "1.0.0"
    }

@router.get("/simulate/history")
async def get_history(limit: int = 20):
    """Get recent simulation runs."""
    return {"history": get_simulation_history(limit)}

@router.post("/simulate/template/{name}")
async def simulate_template(name: str, num_simulations: Optional[int] = 100):
    """Load a mission template by name and run a simulation with it."""
    try:
        template_data = load_mission_template(name)
        mission = Mission(**template_data)
        results = run_comprehensive_simulation(mission, num_simulations)
        return results
    except FileNotFoundError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to run simulation: {e}"}

@router.post("/simulate/export")
async def simulate_export(mission: Mission, num_simulations: Optional[int] = 100):
    """Run a simulation and return CSV and heatmap HTML of detailed failures."""
    results = run_comprehensive_simulation(mission, num_simulations)
    detailed_failures = results.get('detailed_failures', [])
    csv_str = generate_csv(detailed_failures)
    heatmap_html = generate_heatmap(detailed_failures)
    return {"csv": csv_str, "heatmap_html": heatmap_html}