import React, { useState, useEffect, useRef } from 'react';
import VisualSimulation from './VisualSimulation';
import ThreeDVisualization from './ThreeDVisualization';

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
}

interface FailureScenario {
  id: string;
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

interface SimulationResult {
  simulation_summary: {
    total_simulations: number;
    successful_runs: number;
    failed_runs: number;
    success_rate_percentage: number;
    waypoint_failure_counts: Record<string, number>;
    waypoint_failure_rates: Record<string, number>;
  };
  detailed_failures: Array<{
    run_number: number;
    waypoint_id: string;
    waypoint_name: string;
    scenario_id: string;
    scenario_name: string;
    failure_type: string;
    severity: string;
  }>;
}

interface Props {
  mission: Mission | null;
  simulationResult: SimulationResult | null;
}

const SimulationDashboard: React.FC<Props> = ({ mission, simulationResult }) => {
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationStep, setSimulationStep] = useState(0);
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'split'>('split');
  const [currentRun, setCurrentRun] = useState(1);
  const [totalRuns] = useState(100);
  const [activeFailures, setActiveFailures] = useState<string[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Reset simulation when mission changes
  useEffect(() => {
    setCurrentWaypointIndex(0);
    setSimulationStep(0);
    setCurrentRun(1);
    setActiveFailures([]);
    setIsPlaying(false);
  }, [mission]);

  // Animation loop for simulation
  useEffect(() => {
    if (!isPlaying || !mission?.waypoints.length) return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastTimeRef.current) * simulationSpeed;

      if (deltaTime > 1000) { // Move every second
        setSimulationStep(prev => {
          const newStep = prev + 1;
          
          // Move to next waypoint
          if (newStep % 10 === 0) { // Stay at each waypoint for 10 steps
            setCurrentWaypointIndex(prevIndex => {
              const nextIndex = Math.min(prevIndex + 1, mission.waypoints.length - 1);
              
              // If reached end, start next run or finish
              if (nextIndex === mission.waypoints.length - 1) {
                setCurrentRun(prevRun => {
                  const nextRun = prevRun + 1;
                  if (nextRun > totalRuns) {
                    setIsPlaying(false);
                    return prevRun;
                  }
                  return nextRun;
                });
                setCurrentWaypointIndex(0);
              }
              
              return nextIndex;
            });
          }

          // Simulate failures based on scenarios
          if (mission.failure_scenarios) {
            const currentFailures = mission.failure_scenarios
              .filter(scenario => {
                const currentWaypoint = mission.waypoints[currentWaypointIndex];
                return scenario.affected_waypoint_ids.includes(currentWaypoint.id) &&
                       Math.random() < scenario.probability;
              })
              .flatMap(scenario => scenario.affected_waypoint_ids);
            setActiveFailures(currentFailures);
          }

          lastTimeRef.current = currentTime;
          return newStep;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mission, simulationSpeed, totalRuns]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentWaypointIndex(0);
    setSimulationStep(0);
    setCurrentRun(1);
    setActiveFailures([]);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentWaypointIndex < (mission?.waypoints.length || 0) - 1) {
      setCurrentWaypointIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentWaypointIndex > 0) {
      setCurrentWaypointIndex(prev => prev - 1);
    }
  };

  const getCurrentWaypoint = () => {
    return mission?.waypoints[currentWaypointIndex];
  };

  const getProgressPercentage = () => {
    if (!mission?.waypoints.length) return 0;
    return ((currentWaypointIndex + 1) / mission.waypoints.length) * 100;
  };

  const getRunProgressPercentage = () => {
    return (currentRun / totalRuns) * 100;
  };

  if (!mission) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Simulation Dashboard</h3>
        <p className="text-gray-600">Create a mission to start the visual simulation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Simulation Controls</h3>
          <div className="flex gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as '2D' | '3D' | 'split')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="2D">2D View</option>
              <option value="3D">3D View</option>
              <option value="split">Split View</option>
            </select>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleStepBackward}
            disabled={currentWaypointIndex === 0}
            className="px-3 py-2 rounded bg-gray-500 text-white disabled:opacity-50"
          >
            ⏮️ Step Back
          </button>
          
          <button
            onClick={handlePlayPause}
            className={`px-6 py-2 rounded text-white font-semibold ${
              isPlaying ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={handleStepForward}
            disabled={currentWaypointIndex === (mission.waypoints.length - 1)}
            className="px-3 py-2 rounded bg-gray-500 text-white disabled:opacity-50"
          >
            ⏭️ Step Forward
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded bg-gray-500 text-white"
          >
            🔄 Reset
          </button>
          
          <select
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Mission Progress</span>
              <span>{currentWaypointIndex + 1} / {mission.waypoints.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Simulation Run</span>
              <span>{currentRun} / {totalRuns}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getRunProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Current Waypoint</div>
            <div className="font-semibold">{getCurrentWaypoint()?.name || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Step</div>
            <div className="font-semibold">{simulationStep}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Speed</div>
            <div className="font-semibold">{simulationSpeed}x</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Active Failures</div>
            <div className="font-semibold">{activeFailures.length}</div>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid gap-6">
        {viewMode === '2D' && (
          <VisualSimulation
            mission={mission}
            simulationResult={simulationResult}
          />
        )}
        
        {viewMode === '3D' && (
          <ThreeDVisualization
            mission={mission}
            isPlaying={isPlaying}
            currentWaypointIndex={currentWaypointIndex}
            simulationStep={simulationStep}
          />
        )}
        
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisualSimulation
              mission={mission}
              simulationResult={simulationResult}
            />
            <ThreeDVisualization
              mission={mission}
              isPlaying={isPlaying}
              currentWaypointIndex={currentWaypointIndex}
              simulationStep={simulationStep}
            />
          </div>
        )}
      </div>

      {/* Mission Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Mission Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Mission Details</h4>
            <p><strong>Name:</strong> {mission.mission_name}</p>
            <p><strong>Total Waypoints:</strong> {mission.waypoints.length}</p>
            <p><strong>Failure Scenarios:</strong> {mission.failure_scenarios?.length || 0}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Current Waypoint</h4>
            {getCurrentWaypoint() && (
              <>
                <p><strong>Name:</strong> {getCurrentWaypoint()?.name}</p>
                <p><strong>Type:</strong> {getCurrentWaypoint()?.waypoint_type}</p>
                <p><strong>Altitude:</strong> {getCurrentWaypoint()?.altitude}m</p>
                <p><strong>Position:</strong> ({getCurrentWaypoint()?.coordinates.x}, {getCurrentWaypoint()?.coordinates.y}, {getCurrentWaypoint()?.coordinates.z})</p>
              </>
            )}
          </div>
          
          {simulationResult && (
            <div>
              <h4 className="font-semibold mb-2">Simulation Results</h4>
              <p><strong>Success Rate:</strong> {simulationResult.simulation_summary.success_rate_percentage}%</p>
              <p><strong>Total Runs:</strong> {simulationResult.simulation_summary.total_simulations}</p>
              <p><strong>Failed Runs:</strong> {simulationResult.simulation_summary.failed_runs}</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Failures */}
      {activeFailures.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Active Failures</h4>
          <div className="space-y-1">
            {activeFailures.map((waypointId, index) => {
              const waypoint = mission.waypoints.find(wp => wp.id === waypointId);
              const scenarios = mission.failure_scenarios?.filter(sc => 
                sc.affected_waypoint_ids.includes(waypointId)
              ) || [];
              
              return (
                <div key={index} className="text-sm text-red-700">
                  <strong>{waypoint?.name || waypointId}</strong>: {
                    scenarios.map(sc => sc.name).join(', ')
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationDashboard; 