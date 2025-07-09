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
  altitude: number;
  description?: string;
}

interface FailureScenario {
  id?: string;
  name: string;
  failure_types: string[];
  affected_waypoint_ids: string[];
  severity: string;
  probability: number;
}

interface Mission {
  mission_name: string;
  waypoints: Waypoint[];
  failure_scenarios: FailureScenario[];
}

interface Props {
  onResult: (result: any, originalMission: any) => void;
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
    mission_name: "",
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
        { id: "", name: "", waypoint_type: "START", coordinates: { x: 0, y: 0, z: 0 }, altitude: 0, description: "" }
      ]
    }));
  };

  const handleChange = (idx: number, field: string, value: any) => {
    setMission(m => {
      const waypoints = [...m.waypoints];
      (waypoints[idx] as any)[field] = value;
      // Always keep waypoint_type uppercase
      if (field === "waypoint_type") {
        waypoints[idx].waypoint_type = value.toUpperCase();
      }
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
          id: crypto.randomUUID(),
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
    console.log("Form submitted, building mission...");
    setLoading(true);
    // Build mission object with correct schema
    const missionToSend = {
      ...mission,
      waypoints: mission.waypoints.map(wp => ({
        ...wp,
        waypoint_type: wp.waypoint_type.toUpperCase(),
        altitude: Number(wp.altitude),
        description: wp.description || undefined
      })),
      failure_scenarios: mission.failure_scenarios.map(sc => ({
        ...sc,
        id: sc.id || crypto.randomUUID(),
        probability: Number(sc.probability)
      }))
    };
    console.log("Mission to send:", missionToSend);
    try {
      console.log("Making POST request to http://localhost:8001/simulate");
      const res = await axios.post("http://localhost:8001/simulate", missionToSend);
      console.log("Response received:", res.data);
      onResult(res.data, missionToSend); // Pass both result and original mission
    } catch (err: any) {
      console.error("Simulation error:", err);
      // Show detailed validation error if available
      if (err.response && err.response.data) {
        console.error("Validation error details:", err.response.data);
        alert("Simulation failed: " + JSON.stringify(err.response.data, null, 2));
      } else {
        alert("Simulation failed: " + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Mission Name"
        value={mission.mission_name}
        onChange={e => setMission(m => ({ ...m, mission_name: e.target.value }))}
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
            <option value="START">Start</option>
            <option value="CHECKPOINT">Checkpoint</option>
            <option value="END">End</option>
          </select>
          <span> X: <input type="number" value={wp.coordinates.x} onChange={e => handleCoordChange(idx, "x", Number(e.target.value))} style={{ width: 50 }} /></span>
          <span> Y: <input type="number" value={wp.coordinates.y} onChange={e => handleCoordChange(idx, "y", Number(e.target.value))} style={{ width: 50 }} /></span>
          <span> Z: <input type="number" value={wp.coordinates.z} onChange={e => handleCoordChange(idx, "z", Number(e.target.value))} style={{ width: 50 }} /></span>
          <input
            placeholder="Altitude"
            type="number"
            value={wp.altitude}
            onChange={e => handleChange(idx, "altitude", Number(e.target.value))}
            required
          />
          <input
            placeholder="Description (optional)"
            value={wp.description || ""}
            onChange={e => handleChange(idx, "description", e.target.value)}
          />
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
              <option key={wp.id} value={wp.id}>{wp.name ? `${wp.name} (${wp.id})` : wp.id}</option>
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