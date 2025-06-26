#!/usr/bin/env python3
"""
Example script demonstrating mission simulation with failure scenarios.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schema import Mission, Waypoint, FailureScenario, WaypointType, FailureType, FailureSeverity, Coordinates
from app.services.simulate_runner import run_comprehensive_simulation
import json

def create_sample_mission():
    """Create a sample mission for demonstration."""
    
    # Create waypoints
    waypoints = [
        Waypoint(
            name="Start Point",
            waypoint_type=WaypointType.START,
            coordinates=Coordinates(x=0.0, y=0.0, z=100.0),
            altitude=100.0,
            description="Mission start location"
        ),
        Waypoint(
            name="Checkpoint Alpha",
            waypoint_type=WaypointType.CHECKPOINT,
            coordinates=Coordinates(x=10.0, y=5.0, z=120.0),
            altitude=120.0,
            description="First checkpoint"
        ),
        Waypoint(
            name="Delivery Zone",
            waypoint_type=WaypointType.DELIVERY,
            coordinates=Coordinates(x=20.0, y=15.0, z=110.0),
            altitude=110.0,
            description="Package delivery location"
        ),
        Waypoint(
            name="Emergency Landing Site",
            waypoint_type=WaypointType.EMERGENCY_LANDING,
            coordinates=Coordinates(x=15.0, y=10.0, z=50.0),
            altitude=50.0,
            description="Emergency landing zone"
        ),
        Waypoint(
            name="End Point",
            waypoint_type=WaypointType.END,
            coordinates=Coordinates(x=25.0, y=20.0, z=100.0),
            altitude=100.0,
            description="Mission end location"
        )
    ]
    
    # Create failure scenarios
    failure_scenarios = [
        FailureScenario(
            name="GPS Signal Loss at Start",
            failure_types=[FailureType.GPS_SIGNAL_LOSS],
            severity=FailureSeverity.HIGH,
            affected_waypoint_ids=[waypoints[0].id],
            probability=0.1,
            description="GPS signal interference at mission start",
            impact_score=7.0,
            mitigation_strategies=["Use backup navigation", "Return to base"]
        ),
        FailureScenario(
            name="Weather Conditions at Checkpoint",
            failure_types=[FailureType.WEATHER_CONDITION],
            severity=FailureSeverity.MEDIUM,
            affected_waypoint_ids=[waypoints[1].id],
            probability=0.25,
            description="Adverse weather at checkpoint alpha",
            impact_score=5.0,
            mitigation_strategies=["Wait for weather to clear", "Use alternative route"]
        ),
        FailureScenario(
            name="Battery Drain During Delivery",
            failure_types=[FailureType.BATTERY_DRAIN],
            severity=FailureSeverity.CRITICAL,
            affected_waypoint_ids=[waypoints[2].id],
            probability=0.05,
            description="Critical battery drain during delivery",
            impact_score=9.0,
            mitigation_strategies=["Emergency landing", "Battery replacement"]
        ),
        FailureScenario(
            name="Communication Loss",
            failure_types=[FailureType.COMMUNICATION_LOSS],
            severity=FailureSeverity.MEDIUM,
            affected_waypoint_ids=[waypoints[1].id, waypoints[2].id],
            probability=0.15,
            description="Communication system failure",
            impact_score=6.0,
            mitigation_strategies=["Use backup communication", "Autonomous mode"]
        ),
        FailureScenario(
            name="Sensor Failure",
            failure_types=[FailureType.SENSOR_FAILURE],
            severity=FailureSeverity.LOW,
            affected_waypoint_ids=[waypoints[3].id],
            probability=0.3,
            description="Minor sensor malfunction",
            impact_score=3.0,
            mitigation_strategies=["Sensor recalibration", "Use backup sensors"]
        )
    ]
    
    # Create mission
    mission = Mission(
        name="Sample Delivery Mission",
        description="A sample mission demonstrating failure simulation",
        waypoints=waypoints,
        failure_scenarios=failure_scenarios,
        estimated_duration=3600.0,  # 1 hour
        priority=5
    )
    
    return mission

def main():
    """Run the simulation example."""
    print("🚀 Mission Simulation Example")
    print("=" * 50)
    
    # Create sample mission
    mission = create_sample_mission()
    print(f"Mission: {mission.name}")
    print(f"Waypoints: {len(mission.waypoints)}")
    print(f"Failure Scenarios: {len(mission.failure_scenarios)}")
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
        print(f"{failure_type.value}: {count} occurrences")
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