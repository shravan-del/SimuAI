# backend/app/services/simulate_runner.py
import random
from typing import List, Dict, Any, Tuple
from datetime import datetime
from app.schema import Mission, FailureScenario, Waypoint, MissionStatus, FailureSeverity
from app.services.db_service import log_simulation_result

class MissionSimulationResult:
    def __init__(self):
        self.total_runs = 0
        self.successful_runs = 0
        self.failed_runs = 0
        self.waypoint_failures = {}  # waypoint_id -> failure_count
        self.failure_type_counts = {}  # failure_type -> count
        self.severity_counts = {}  # severity -> count
        self.failure_scenarios_triggered = {}  # scenario_id -> count
        self.detailed_failures = []  # List of detailed failure records

def isoformat_dt(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, list):
        return [isoformat_dt(x) for x in obj]
    if isinstance(obj, dict):
        return {k: isoformat_dt(v) for k, v in obj.items()}
    return obj

def simulate_mission(mission: Mission, num_simulations: int = 100) -> MissionSimulationResult:
    """
    Simulate a mission multiple times and track failures by waypoint.
    
    Args:
        mission: The mission to simulate
        num_simulations: Number of times to run the simulation (default: 100)
    
    Returns:
        MissionSimulationResult object with detailed failure statistics
    """
    result = MissionSimulationResult()
    result.total_runs = num_simulations
    
    # Initialize failure tracking dictionaries
    for waypoint in mission.waypoints:
        result.waypoint_failures[waypoint.id] = 0
    
    for scenario in mission.failure_scenarios:
        for failure_type in scenario.failure_types:
            result.failure_type_counts[failure_type] = 0
        result.failure_scenarios_triggered[scenario.id] = 0
        result.severity_counts[scenario.severity] = 0
    
    # Run simulations
    for run_number in range(num_simulations):
        mission_successful = True
        run_failures = []
        
        # Simulate each waypoint in sequence
        for waypoint in mission.waypoints:
            # Check if any failure scenarios trigger at this waypoint
            triggered_scenarios = []
            
            for scenario in mission.failure_scenarios:
                if waypoint.id in scenario.affected_waypoint_ids:
                    # Use random probability to determine if failure occurs
                    if random.random() < scenario.probability:
                        triggered_scenarios.append(scenario)
            
            # If any failures triggered, record them and mark mission as failed
            if triggered_scenarios:
                mission_successful = False
                result.waypoint_failures[waypoint.id] += 1
                
                # Record detailed failure information
                for scenario in triggered_scenarios:
                    for failure_type in scenario.failure_types:
                        result.failure_type_counts[failure_type] += 1
                        run_failures.append({
                            'run_number': run_number + 1,
                            'waypoint_id': waypoint.id,
                            'waypoint_name': waypoint.name,
                            'scenario_id': scenario.id,
                            'scenario_name': scenario.name,
                            'failure_type': failure_type,
                            'severity': scenario.severity,
                            'timestamp': datetime.utcnow()
                        })
                    result.failure_scenarios_triggered[scenario.id] += 1
                    result.severity_counts[scenario.severity] += 1
                
                # Break after first failure (mission fails)
                break
        
        if mission_successful:
            result.successful_runs += 1
        else:
            result.failed_runs += 1
            result.detailed_failures.extend(run_failures)
    
    return result

def get_simulation_summary(result: MissionSimulationResult) -> Dict[str, Any]:
    """
    Generate a summary of simulation results.
    
    Args:
        result: MissionSimulationResult object
    
    Returns:
        Dictionary with summary statistics
    """
    success_rate = (result.successful_runs / result.total_runs) * 100 if result.total_runs > 0 else 0
    
    # Find most problematic waypoints
    waypoint_failure_rates = {
        waypoint_id: (count / result.total_runs) * 100 
        for waypoint_id, count in result.waypoint_failures.items()
    }
    
    # Find most common failure types
    most_common_failure_types = sorted(
        result.failure_type_counts.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    # Find most common severity levels
    most_common_severities = sorted(
        result.severity_counts.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    return {
        'total_simulations': result.total_runs,
        'successful_runs': result.successful_runs,
        'failed_runs': result.failed_runs,
        'success_rate_percentage': round(success_rate, 2),
        'failure_rate_percentage': round(100 - success_rate, 2),
        'waypoint_failure_counts': result.waypoint_failures,
        'waypoint_failure_rates': {k: round(v, 2) for k, v in waypoint_failure_rates.items()},
        'failure_type_counts': result.failure_type_counts,
        'severity_counts': result.severity_counts,
        'most_common_failure_types': most_common_failure_types,
        'most_common_severities': most_common_severities,
        'total_failures_triggered': sum(result.failure_scenarios_triggered.values()),
        'detailed_failures_count': len(result.detailed_failures)
    }

def analyze_mission_risk(mission: Mission) -> Dict[str, Any]:
    """
    Analyze mission risk based on failure scenarios.
    
    Args:
        mission: The mission to analyze
    
    Returns:
        Dictionary with risk analysis
    """
    # Calculate overall risk score
    total_risk_score = 0
    waypoint_risks = {}
    
    severity_weights = {"low": 0.5, "medium": 1.0, "high": 1.5, "critical": 2.0}
    failure_type_weights = {
        "sensor_failure": 1.0,
        "mechanical_failure": 1.2,
        "communication_loss": 1.3,
        "weather_condition": 1.1,
        "battery_drain": 1.1,
        "gps_signal_loss": 1.2,
        "obstacle_detection": 1.0
    }
    for waypoint in mission.waypoints:
        waypoint_risk = 0
        affecting_scenarios = [
            scenario for scenario in mission.failure_scenarios 
            if waypoint.id in scenario.affected_waypoint_ids
        ]
        
        for scenario in affecting_scenarios:
            # Risk = probability * severity_weight * sum(failure_type_weights)
            severity_weight = severity_weights.get(scenario.severity, 1)
            type_weight_sum = sum(failure_type_weights.get(ftype, 1) for ftype in scenario.failure_types)
            scenario_risk = scenario.probability * severity_weight * type_weight_sum
            waypoint_risk += scenario_risk
        
        waypoint_risks[waypoint.id] = round(waypoint_risk, 3)
        total_risk_score += waypoint_risk
    
    # Find high-risk waypoints
    high_risk_waypoints = [
        wp_id for wp_id, risk in waypoint_risks.items() 
        if risk > total_risk_score / len(mission.waypoints) * 1.5
    ]
    
    return {
        'total_risk_score': round(total_risk_score, 3),
        'average_risk_per_waypoint': round(total_risk_score / len(mission.waypoints), 3),
        'waypoint_risks': waypoint_risks,
        'high_risk_waypoints': high_risk_waypoints,
        'risk_level': 'HIGH' if total_risk_score > 10 else 'MEDIUM' if total_risk_score > 5 else 'LOW'
    }

def run_comprehensive_simulation(mission: Mission, num_simulations: int = 100) -> Dict[str, Any]:
    """
    Run a comprehensive mission simulation with risk analysis.
    
    Args:
        mission: The mission to simulate
        num_simulations: Number of simulation runs
    
    Returns:
        Dictionary with simulation results and risk analysis
    """
    # Run simulation
    simulation_result = simulate_mission(mission, num_simulations)
    
    # Get summary
    summary = get_simulation_summary(simulation_result)
    
    # Get risk analysis
    risk_analysis = analyze_mission_risk(mission)
    
    result_dict = {
        'simulation_summary': summary,
        'risk_analysis': risk_analysis,
        'detailed_failures': isoformat_dt(simulation_result.detailed_failures[:10]),  # First 10 detailed failures
        'timestamp': datetime.utcnow().isoformat(),
        'mission_name': mission.name
    }
    # Log to DB
    log_simulation_result(result_dict)
    return isoformat_dt(result_dict)