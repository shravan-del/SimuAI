#!/usr/bin/env python3
"""
Test script for the FastAPI simulation endpoint.
"""

import requests
import json
from datetime import datetime
from app.schema import Mission, Waypoint, FailureScenario, WaypointType, FailureType, FailureSeverity, Coordinates

def create_test_mission():
    """Create a test mission for API testing."""
    
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
            name="GPS Signal Loss",
            failure_types=[FailureType.GPS_SIGNAL_LOSS],
            severity=FailureSeverity.HIGH,
            affected_waypoint_ids=[waypoints[0].id],
            probability=0.15,
            description="GPS signal interference",
            impact_score=7.0
        ),
        FailureScenario(
            name="Weather Conditions",
            failure_types=[FailureType.WEATHER_CONDITION],
            severity=FailureSeverity.MEDIUM,
            affected_waypoint_ids=[waypoints[1].id],
            probability=0.25,
            description="Adverse weather",
            impact_score=5.0
        ),
        FailureScenario(
            name="Battery Drain",
            failure_types=[FailureType.BATTERY_DRAIN],
            severity=FailureSeverity.CRITICAL,
            affected_waypoint_ids=[waypoints[2].id],
            probability=0.05,
            description="Critical battery drain",
            impact_score=9.0
        )
    ]
    
    # Create mission
    mission = Mission(
        name="Test Delivery Mission",
        description="A test mission for API validation",
        waypoints=waypoints,
        failure_scenarios=failure_scenarios,
        estimated_duration=1800.0,  # 30 minutes
        priority=7
    )
    
    return mission

def serialize_mission(mission):
    """Serialize mission to JSON-compatible dict, handling datetime objects."""
    mission_dict = mission.model_dump()
    
    # Convert datetime objects to ISO strings
    if 'created_at' in mission_dict:
        mission_dict['created_at'] = mission_dict['created_at'].isoformat()
    if 'updated_at' in mission_dict:
        mission_dict['updated_at'] = mission_dict['updated_at'].isoformat()
    
    return mission_dict

def test_simulation_endpoint():
    """Test the simulation endpoint."""
    
    # Create test mission
    mission = create_test_mission()
    
    # Convert mission to dict for JSON serialization
    mission_dict = serialize_mission(mission)
    
    # API endpoint URL (assuming FastAPI runs on localhost:8001)
    base_url = "http://localhost:8001"
    
    print("🚀 Testing Mission Simulation API")
    print("=" * 50)
    
    # Test 1: Full simulation endpoint
    print("\n📊 Testing /simulate endpoint...")
    try:
        response = requests.post(
            f"{base_url}/simulate",
            json=mission_dict,
            params={"num_simulations": 50},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Full simulation successful!")
            print(f"Success Rate: {result['success_rate']['percentage']}%")
            print(f"Total Simulations: {result['simulation_config']['total_simulations']}")
            print(f"Risk Level: {result['risk_analysis']['risk_level']}")
            
            # Print waypoint failures
            print("\n🎯 Waypoint Failures:")
            for wp_id, count in result['failure_summary']['waypoint_failures'].items():
                waypoint = next(wp for wp in mission.waypoints if wp.id == wp_id)
                rate = result['failure_summary']['waypoint_failure_rates'][wp_id]
                print(f"  {waypoint.name}: {count} failures ({rate}%)")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 2: Quick simulation endpoint
    print("\n⚡ Testing /simulate/quick endpoint...")
    try:
        response = requests.post(
            f"{base_url}/simulate/quick",
            json=mission_dict,
            params={"num_simulations": 25},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Quick simulation successful!")
            print(f"Success Rate: {result['success_rate_percentage']}%")
            print(f"Total Simulations: {result['total_simulations']}")
            
            # Print top failure types
            print("\n⚠️  Top Failure Types:")
            for failure_type, count in result['most_common_failure_types']:
                print(f"  {failure_type}: {count} occurrences")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    # Test 3: Health check endpoint
    print("\n🏥 Testing /simulate/health endpoint...")
    try:
        response = requests.get(f"{base_url}/simulate/health", timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check successful!")
            print(f"Status: {result['status']}")
            print(f"Service: {result['service']}")
            print(f"Version: {result['version']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
    
    print("\n✅ API testing completed!")

def test_invalid_mission():
    """Test the endpoint with invalid mission data."""
    
    print("\n🧪 Testing with invalid mission data...")
    
    # Invalid mission (missing required fields)
    invalid_mission = {
        "name": "Invalid Mission",
        "waypoints": []  # Empty waypoints list should fail validation
    }
    
    try:
        response = requests.post(
            "http://localhost:8001/simulate",
            json=invalid_mission,
            timeout=10
        )
        
        if response.status_code == 422:
            print("✅ Properly rejected invalid mission (validation error)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def test_simulation_history():
    """Test the simulation history endpoint."""
    print("\n🕑 Testing /simulate/history endpoint...")
    try:
        response = requests.get("http://localhost:8001/simulate/history?limit=3", timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ History returned {len(result['history'])} runs.")
            for entry in result['history']:
                print(f"  - {entry.get('mission_name', 'N/A')} at {entry.get('timestamp', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def test_simulate_export():
    """Test the /simulate/export endpoint for CSV and heatmap export."""
    print("\n📦 Testing /simulate/export endpoint...")
    # Use a simple mission payload
    mission = create_test_mission()
    mission_dict = serialize_mission(mission)
    try:
        response = requests.post(
            "http://localhost:8001/simulate/export",
            json=mission_dict,
            params={"num_simulations": 10},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            if 'csv' in result and 'heatmap_html' in result:
                print("✅ Export returned CSV and heatmap.")
                print(f"CSV sample: {result['csv'][:60]}...")
                print(f"Heatmap HTML sample: {result['heatmap_html'][:60]}...")
            else:
                print("❌ Export missing CSV or heatmap.")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

def test_simulate_template():
    """Test the /simulate/template/{name} endpoint."""
    print("\n📑 Testing /simulate/template/{name} endpoint...")
    try:
        response = requests.post(
            "http://localhost:8001/simulate/template/example",
            params={"num_simulations": 5},
            timeout=20
        )
        if response.status_code == 200:
            result = response.json()
            if 'simulation_summary' in result:
                print("✅ Template simulation ran successfully.")
                print(f"Success Rate: {result['simulation_summary']['success_rate_percentage']}%")
            else:
                print("❌ Template simulation missing summary.")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    test_simulation_endpoint()
    test_invalid_mission()
    test_simulation_history()
    test_simulate_export()
    test_simulate_template() 