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

interface Mission {
  name: string;
  waypoints: Waypoint[];
  failure_scenarios: any[];
}

interface Props {
  onResult: (result: any) => void;
}

const MissionBuilder: React.FC<Props> = ({ onResult }) => {
  const [mission, setMission] = useState<Mission>({
    name: "",
    waypoints: [],
    failure_scenarios: []
  });
  const [loading, setLoading] = useState(false);

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
      {/* Add similar UI for failure_scenarios if needed */}
      <button type="submit" disabled={loading}>Run Simulation</button>
    </form>
  );
};

export default MissionBuilder; 