#!/usr/bin/env python3
"""
Example script demonstrating mission simulation with failure scenarios.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schema import Mission, Waypoint, FailureScenario, WaypointType, FailureType, FailureSeverity, Coordinates, MissionStatus
from app.services.simulate_runner import run_comprehensive_simulation
import json

def create_sample_mission():
    """Create a sample mission for demonstration."""
    
    # Create waypoints
    waypoints = [
        Waypoint(
            id="wp-start",
            name="Start Point",
            waypoint_type="START",
            coordinates=Coordinates(x=0.0, y=0.0, z=100.0),
            altitude=100.0,
            description="Mission start location"
        ),
        Waypoint(
            id="wp-checkpoint",
            name="Checkpoint Alpha",
            waypoint_type="CHECKPOINT",
            coordinates=Coordinates(x=10.0, y=5.0, z=120.0),
            altitude=120.0,
            description="First checkpoint"
        ),
        Waypoint(
            id="wp-delivery",
            name="Delivery Zone",
            waypoint_type="CHECKPOINT",
            coordinates=Coordinates(x=20.0, y=15.0, z=110.0),
            altitude=110.0,
            description="Package delivery location"
        ),
        Waypoint(
            id="wp-emergency",
            name="Emergency Landing Site",
            waypoint_type="CHECKPOINT",
            coordinates=Coordinates(x=15.0, y=10.0, z=50.0),
            altitude=50.0,
            description="Emergency landing zone"
        ),
        Waypoint(
            id="wp-end",
            name="End Point",
            waypoint_type="END",
            coordinates=Coordinates(x=25.0, y=20.0, z=100.0),
            altitude=100.0,
            description="Mission end location"
        )
    ]
    
    # Create failure scenarios
    failure_scenarios = [
        FailureScenario(
            name="GPS Signal Loss at Start",
            failure_types=["gps_signal_loss"],
            severity="high",
            affected_waypoint_ids=[waypoints[0].id],
            probability=0.1
        ),
        FailureScenario(
            name="Weather Conditions at Checkpoint",
            failure_types=["weather_condition"],
            severity="medium",
            affected_waypoint_ids=[waypoints[1].id],
            probability=0.25
        ),
        FailureScenario(
            name="Battery Drain During Delivery",
            failure_types=["battery_drain"],
            severity="high",
            affected_waypoint_ids=[waypoints[2].id],
            probability=0.05
        ),
        FailureScenario(
            name="Communication Loss",
            failure_types=["communication_loss"],
            severity="medium",
            affected_waypoint_ids=[waypoints[1].id, waypoints[2].id],
            probability=0.15
        ),
        FailureScenario(
            name="Sensor Failure",
            failure_types=["sensor_failure"],
            severity="low",
            affected_waypoint_ids=[waypoints[3].id],
            probability=0.3
        )
    ]
    
    # Create mission
    mission = Mission(
        mission_name="Sample Delivery Mission",
        waypoints=waypoints,
        failure_scenarios=failure_scenarios,
        estimated_duration=3600.0,  # 1 hour
        priority=5,
        status=MissionStatus.PLANNED,
        backup_paths=[]
    )
    
    return mission

def main():
    """Run the simulation example."""
    print("🚀 Mission Simulation Example")
    print("=" * 50)
    
    # Create sample mission
    mission = create_sample_mission()
    print(f"Mission: {mission.mission_name}")
    print(f"Waypoints: {len(mission.waypoints)}")
    print(f"Failure Scenarios: {len(mission.failure_scenarios or [])}")
    print()
    
    # Run simulation
    print("Running 100 simulations...")
    results = run_comprehensive_simulation(mission, num_simulations=100)
    
    # Display results
    summary = results['simulation_summary']
    risk_analysis = results['risk_analysis']
    
    print("📊 SIMULATION RESULTS")
    print("-" * 30)
    print(f"Total Simulations: {summary['total_simulations']}")
    print(f"Successful Runs: {summary['successful_runs']}")
    print(f"Failed Runs: {summary['failed_runs']}")
    print(f"Success Rate: {summary['success_rate_percentage']}%")
    print(f"Failure Rate: {summary['failure_rate_percentage']}%")
    print()
    
    print("🎯 WAYPOINT FAILURE ANALYSIS")
    print("-" * 30)
    for waypoint in mission.waypoints:
        failure_count = summary['waypoint_failure_counts'].get(waypoint.id, 0)
        failure_rate = summary['waypoint_failure_rates'].get(waypoint.id, 0)
        print(f"{waypoint.name}: {failure_count} failures ({failure_rate}%)")
    print()
    
    print("⚠️  FAILURE TYPE ANALYSIS")
    print("-" * 30)
    for failure_type, count in summary['most_common_failure_types']:
        print(f"{failure_type}: {count} occurrences")
    print()
    
    print("🚨 RISK ANALYSIS")
    print("-" * 30)
    print(f"Overall Risk Level: {risk_analysis['risk_level']}")
    print(f"Total Risk Score: {risk_analysis['total_risk_score']}")
    print(f"Average Risk per Waypoint: {risk_analysis['average_risk_per_waypoint']}")
    print()
    
    print("🔍 HIGH-RISK WAYPOINTS")
    print("-" * 30)
    for wp_id in risk_analysis['high_risk_waypoints']:
        waypoint = next(wp for wp in mission.waypoints if wp.id == wp_id)
        risk = risk_analysis['waypoint_risks'][wp_id]
        print(f"{waypoint.name}: Risk Score {risk}")
    
    print("\n✅ Simulation completed successfully!")

if __name__ == "__main__":
    main() 