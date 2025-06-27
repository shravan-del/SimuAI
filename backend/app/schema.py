# backend/app/schema.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from enum import Enum
from datetime import datetime
import uuid

class WaypointType(str, Enum):
    START = "start"
    CHECKPOINT = "checkpoint"
    DELIVERY = "delivery"
    EMERGENCY_LANDING = "emergency_landing"
    END = "end"

class FailureType(str, Enum):
    SENSOR_FAILURE = "sensor_failure"
    WEATHER_CONDITION = "weather_condition"
    COMMUNICATION_LOSS = "communication_loss"
    BATTERY_DRAIN = "battery_drain"
    MECHANICAL_FAILURE = "mechanical_failure"
    GPS_SIGNAL_LOSS = "gps_signal_loss"
    OBSTACLE_DETECTION = "obstacle_detection"

class FailureSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Coordinates(BaseModel):
    x: float
    y: float
    z: float

class Waypoint(BaseModel):
    id: str
    name: str
    coordinates: Coordinates
    waypoint_type: Literal["START", "CHECKPOINT", "END"]
    altitude: float
    description: Optional[str] = None

class FailureScenario(BaseModel):
    name: str
    failure_types: List[str]
    affected_waypoint_ids: List[str]
    severity: Literal["low", "medium", "high"]
    probability: float

    @validator("probability")
    def prob_range(cls, v):
        if not 0 <= v <= 1:
            raise ValueError("Probability must be between 0 and 1")
        return v

class MissionStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Mission(BaseModel):
    mission_name: str
    waypoints: List[Waypoint]
    failure_scenarios: Optional[List[FailureScenario]] = []
    status: MissionStatus = Field(MissionStatus.PLANNED, description="Current mission status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Mission creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    estimated_duration: Optional[float] = Field(None, ge=0, description="Estimated duration in seconds")
    priority: Optional[int] = Field(1, ge=1, le=10, description="Mission priority (1-10)")
    backup_paths: Optional[List[List[str]]] = Field(None, description="Alternative waypoint sequences")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional mission metadata")

    @validator('waypoints')
    def validate_waypoints(cls, v):
        if len(v) < 2:
            raise ValueError('Mission must have at least 2 waypoints (start and end)')
        
        # Check for at least one start and one end waypoint
        waypoint_types = [wp.waypoint_type for wp in v]
        if WaypointType.START not in waypoint_types:
            raise ValueError('Mission must have at least one START waypoint')
        if WaypointType.END not in waypoint_types:
            raise ValueError('Mission must have at least one END waypoint')
        
        return v

    @validator('failure_scenarios')
    def validate_failure_scenarios(cls, v, values):
        if 'waypoints' in values:
            waypoint_ids = {wp.id for wp in values['waypoints']}
            for scenario in v:
                for wp_id in scenario.affected_waypoint_ids:
                    if wp_id not in waypoint_ids:
                        raise ValueError(f'Failure scenario references non-existent waypoint: {wp_id}')
        return v

class MissionUpdate(BaseModel):
    status: Optional[MissionStatus] = None
    current_waypoint_id: Optional[str] = None
    active_failures: Optional[List[str]] = Field(default_factory=list, description="List of active failure scenario IDs")
    progress_percentage: Optional[float] = Field(None, ge=0, le=100, description="Mission progress percentage")
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None