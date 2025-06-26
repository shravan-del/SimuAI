import React, { useState } from "react";
import MissionBuilder from "./components/MissionBuilder";
import SimulationResults from "./components/SimulationResults";
import ExportResults from "./components/ExportResults";
import History from "./components/History";
import './App.css'

function App() {
  const [result, setResult] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>SimuAI Dashboard</h1>
      <MissionBuilder
        onResult={res => {
          setResult(res);
          setMission(res?.simulation_summary ? res : null);
        }}
      />
      <SimulationResults result={result} />
      {result && <ExportResults mission={mission} />}
      <History />
    </div>
  );
}

export default App;
