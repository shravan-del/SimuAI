# backend/app/schema.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
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
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    z: Optional[float] = Field(None, description="Z coordinate (altitude)")

class Waypoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique waypoint identifier")
    name: str = Field(..., min_length=1, description="Waypoint name")
    waypoint_type: WaypointType = Field(..., description="Type of waypoint")
    coordinates: Coordinates = Field(..., description="3D coordinates")
    altitude: Optional[float] = Field(None, ge=0, description="Altitude in meters")
    speed_limit: Optional[float] = Field(None, ge=0, description="Speed limit at this waypoint")
    wait_time: Optional[float] = Field(0, ge=0, description="Wait time in seconds")
    description: Optional[str] = Field(None, description="Additional description")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

    @validator('coordinates')
    def validate_coordinates(cls, v):
        if v.x < -180 or v.x > 180:
            raise ValueError('X coordinate must be between -180 and 180')
        if v.y < -90 or v.y > 90:
            raise ValueError('Y coordinate must be between -90 and 90')
        return v

class FailureScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique failure scenario identifier")
    name: str = Field(..., min_length=1, description="Failure scenario name")
    failure_types: List[FailureType] = Field(..., min_items=1, description="List of failure types for this scenario. Example: ['sensor_failure', 'communication_loss']")
    severity: FailureSeverity = Field(..., description="Severity level of the failure")
    affected_waypoint_ids: List[str] = Field(..., min_items=1, description="List of affected waypoint IDs")
    probability: float = Field(..., ge=0, le=1, description="Probability of failure (0-1)")
    duration: Optional[float] = Field(None, ge=0, description="Expected duration in seconds")
    description: Optional[str] = Field(None, description="Detailed description of the failure")
    mitigation_strategies: Optional[List[str]] = Field(default_factory=list, description="Possible mitigation strategies")
    impact_score: Optional[float] = Field(None, ge=0, le=10, description="Impact score (0-10)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

    @validator('affected_waypoint_ids')
    def validate_waypoint_ids(cls, v):
        if not v:
            raise ValueError('At least one waypoint must be affected')
        return v

class MissionStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique mission identifier")
    name: str = Field(..., min_length=1, description="Mission name")
    description: Optional[str] = Field(None, description="Mission description")
    waypoints: List[Waypoint] = Field(..., min_items=2, description="List of waypoints")
    failure_scenarios: List[FailureScenario] = Field(default_factory=list, description="List of failure scenarios")
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