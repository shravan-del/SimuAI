import React, { useState } from "react";
import axios from "axios";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface Waypoint {
  id: string;
  name: string;
  waypoint_type: string;
  coordinates: Coordinates;
}

interface FailureScenario {
  name: string;
  failure_types: string[];
  affected_waypoint_ids: string[];
  severity: string;
  probability: number;
}

interface Mission {
  name: string;
  waypoints: Waypoint[];
  failure_scenarios: FailureScenario[];
}

interface Props {
  onResult: (result: any) => void;
}

const failureTypeOptions = [
  "sensor_failure",
  "mechanical_failure",
  "communication_loss",
  "weather_condition",
  "battery_drain",
  "gps_signal_loss",
  "obstacle_detection"
];

const severityOptions = ["low", "medium", "high", "critical"];

const MissionBuilder: React.FC<Props> = ({ onResult }) => {
  const [mission, setMission] = useState<Mission>({
    name: "",
    waypoints: [],
    failure_scenarios: []
  });
  const [loading, setLoading] = useState(false);

  // Waypoint handlers
  const handleAddWaypoint = () => {
    setMission(m => ({
      ...m,
      waypoints: [
        ...m.waypoints,
        { id: "", name: "", waypoint_type: "start", coordinates: { x: 0, y: 0, z: 0 } }
      ]
    }));
  };

  const handleChange = (idx: number, field: string, value: any) => {
    setMission(m => {
      const waypoints = [...m.waypoints];
      (waypoints[idx] as any)[field] = value;
      return { ...m, waypoints };
    });
  };

  const handleCoordChange = (idx: number, axis: keyof Coordinates, value: number) => {
    setMission(m => {
      const waypoints = [...m.waypoints];
      waypoints[idx].coordinates[axis] = value;
      return { ...m, waypoints };
    });
  };

  // Failure Scenario Handlers
  const handleAddScenario = () => {
    setMission(m => ({
      ...m,
      failure_scenarios: [
        ...m.failure_scenarios,
        {
          name: "",
          failure_types: [],
          affected_waypoint_ids: [],
          severity: "medium",
          probability: 0.1
        }
      ]
    }));
  };

  const handleScenarioChange = (idx: number, field: string, value: any) => {
    setMission(m => {
      const scenarios = [...m.failure_scenarios];
      (scenarios[idx] as any)[field] = value;
      return { ...m, failure_scenarios: scenarios };
    });
  };

  const handleScenarioTypeChange = (idx: number, value: string[]) => {
    setMission(m => {
      const scenarios = [...m.failure_scenarios];
      scenarios[idx].failure_types = value;
      return { ...m, failure_scenarios: scenarios };
    });
  };

  const handleScenarioWaypointChange = (idx: number, value: string[]) => {
    setMission(m => {
      const scenarios = [...m.failure_scenarios];
      scenarios[idx].affected_waypoint_ids = value;
      return { ...m, failure_scenarios: scenarios };
    });
  };

  const handleRemoveScenario = (idx: number) => {
    setMission(m => {
      const scenarios = [...m.failure_scenarios];
      scenarios.splice(idx, 1);
      return { ...m, failure_scenarios: scenarios };
    });
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8001/simulate", mission);
      onResult(res.data);
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Mission Name"
        value={mission.name}
        onChange={e => setMission(m => ({ ...m, name: e.target.value }))}
        required
      />
      <h3>Waypoints</h3>
      {mission.waypoints.map((wp, idx) => (
        <div key={idx} style={{ marginBottom: 8 }}>
          <input
            placeholder="ID"
            value={wp.id}
            onChange={e => handleChange(idx, "id", e.target.value)}
            required
          />
          <input
            placeholder="Name"
            value={wp.name}
            onChange={e => handleChange(idx, "name", e.target.value)}
            required
          />
          <select
            value={wp.waypoint_type}
            onChange={e => handleChange(idx, "waypoint_type", e.target.value)}
          >
            <option value="start">Start</option>
            <option value="checkpoint">Checkpoint</option>
            <option value="end">End</option>
          </select>
          <span> X: <input type="number" value={wp.coordinates.x} onChange={e => handleCoordChange(idx, "x", Number(e.target.value))} style={{ width: 50 }} /></span>
          <span> Y: <input type="number" value={wp.coordinates.y} onChange={e => handleCoordChange(idx, "y", Number(e.target.value))} style={{ width: 50 }} /></span>
          <span> Z: <input type="number" value={wp.coordinates.z} onChange={e => handleCoordChange(idx, "z", Number(e.target.value))} style={{ width: 50 }} /></span>
        </div>
      ))}
      <button type="button" onClick={handleAddWaypoint}>Add Waypoint</button>

      {/* --- Failure Scenarios UI --- */}
      <h3>Failure Scenarios</h3>
      {mission.failure_scenarios.map((sc, idx) => (
        <div key={idx} style={{ marginBottom: 8, border: "1px solid #444", padding: 8 }}>
          <input
            placeholder="Scenario Name"
            value={sc.name}
            onChange={e => handleScenarioChange(idx, "name", e.target.value)}
            required
          />
          <select
            multiple
            value={sc.failure_types}
            onChange={e =>
              handleScenarioTypeChange(
                idx,
                Array.from(e.target.selectedOptions, option => option.value)
              )
            }
          >
            {failureTypeOptions.map(ft => (
              <option key={ft} value={ft}>{ft}</option>
            ))}
          </select>
          <select
            multiple
            value={sc.affected_waypoint_ids}
            onChange={e =>
              handleScenarioWaypointChange(
                idx,
                Array.from(e.target.selectedOptions, option => option.value)
              )
            }
          >
            {mission.waypoints.map(wp => (
              <option key={wp.id} value={wp.id}>{wp.name || wp.id}</option>
            ))}
          </select>
          <select
            value={sc.severity}
            onChange={e => handleScenarioChange(idx, "severity", e.target.value)}
          >
            {severityOptions.map(sv => (
              <option key={sv} value={sv}>{sv}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={sc.probability}
            onChange={e => handleScenarioChange(idx, "probability", Number(e.target.value))}
            required
          />
          <button type="button" onClick={() => handleRemoveScenario(idx)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={handleAddScenario}>Add Failure Scenario</button>
      <br />
      <button type="submit" disabled={loading}>Run Simulation</button>
    </form>
  );
};

export default MissionBuilder; 