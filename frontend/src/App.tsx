import React, { useState } from "react";
import MissionBuilder from "./components/MissionBuilder";
import SimulationResults from "./components/SimulationResults";
import ExportResults from "./components/ExportResults";
import History from "./components/History";
import ResultsPanel from "./components/ResultsPanel";
import ExportButton from "./components/ExportButton";
import UploadMap from "./components/UploadMap";
import './App.css'

function App() {
  const [result, setResult] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);

  // Transform backend result to ResultsPanel format
  const getResultsPanelData = () => {
    if (!result || !result.simulation_summary) return null;
    const summary = result.simulation_summary;
    const topFailures = (summary.most_common_failure_types || []).map(([type, count]: [string, number]) => ({ type, count }));
    return {
      successRate: summary.success_rate_percentage,
      topFailures,
      suggestion: result.recommendation || "No suggestion."
    };
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>SimuAI Dashboard</h1>
      <UploadMap />
      <MissionBuilder
        onResult={res => {
          setResult(res);
          setMission(res?.simulation_summary ? res : null);
        }}
      />
      <SimulationResults result={result} />
      {result && <ResultsPanel results={getResultsPanelData()} />}
      {mission && (
        <ExportButton
          missionName={mission.mission_name || mission.name || "Mission"}
          waypoints={mission.waypoints}
          failureScenarios={mission.failure_scenarios}
        />
      )}
      {result && <ExportResults mission={mission} />}
      <History />
    </div>
  );
}

export default App;
