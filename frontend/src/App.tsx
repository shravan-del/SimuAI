import { useState } from "react";
import MissionBuilder from "./components/MissionBuilder";
import ExportResults from "./components/ExportResults";
import History from "./components/History";
import ResultsPanel from "./components/ResultsPanel";
import ExportButton from "./components/ExportButton";
import UploadMap from "./components/UploadMap";
import SimulationDashboard from "./components/SimulationDashboard";
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
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <h1 className="text-3xl font-bold text-center mb-8">🚁 SimuAI Mission Simulator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Mission Builder */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Mission Builder</h2>
            <UploadMap />
            <MissionBuilder
              onResult={(res, originalMission) => {
                setResult(res);
                setMission(originalMission); // Pass the original mission data
              }}
            />
          </div>
          
          {/* Results Panel */}
          {result && getResultsPanelData() && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <ResultsPanel results={getResultsPanelData()!} />
            </div>
          )}
          
          {/* Export Controls */}
          {mission && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Export Options</h3>
              <div className="space-y-3">
                <ExportButton
                  missionName={mission.mission_name || mission.name || "Mission"}
                  waypoints={mission.waypoints}
                  failureScenarios={mission.failure_scenarios}
                />
                {result && <ExportResults mission={mission} />}
              </div>
            </div>
          )}
          
          {/* History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <History />
          </div>
        </div>
        
        {/* Right Column - Visual Simulation */}
        <div className="lg:col-span-2">
          <SimulationDashboard 
            mission={mission}
            simulationResult={result}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
