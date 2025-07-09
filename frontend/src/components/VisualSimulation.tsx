import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Group, Rect } from 'react-konva';

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

const VisualSimulation: React.FC<Props> = ({ mission, simulationResult }) => {
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0 });
  const [activeFailures, setActiveFailures] = useState<string[]>([]);
  const [simulationStep, setSimulationStep] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;
  const margin = 50;

  // Calculate scale and offset to fit waypoints in canvas
  const getTransformData = () => {
    if (!mission?.waypoints.length) return { scale: 1, offsetX: 0, offsetY: 0 };

    const coords = mission.waypoints.map(wp => wp.coordinates);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxY = Math.max(...coords.map(c => c.y));

    const scaleX = (canvasWidth - 2 * margin) / (maxX - minX || 1);
    const scaleY = (canvasHeight - 2 * margin) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY, 2); // Cap scale at 2x

    const offsetX = margin + (canvasWidth - 2 * margin - (maxX - minX) * scale) / 2;
    const offsetY = margin + (canvasHeight - 2 * margin - (maxY - minY) * scale) / 2;

    return { scale, offsetX, offsetY, minX, minY };
  };

  const transformCoord = (coord: Coordinates) => {
    const { scale, offsetX, offsetY, minX, minY } = getTransformData();
    return {
      x: (coord.x - (minX || 0)) * scale + offsetX,
      y: (coord.y - (minY || 0)) * scale + offsetY
    };
  };

  // Animation loop
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
              return nextIndex;
            });
          }

          // Check for failures
          if (simulationResult?.detailed_failures) {
            const currentFailures = simulationResult.detailed_failures
              .filter(failure => failure.run_number === Math.floor(newStep / 50) + 1)
              .map(failure => failure.waypoint_id);
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
  }, [isPlaying, mission, simulationSpeed, simulationResult]);

  // Update drone position
  useEffect(() => {
    if (!mission?.waypoints.length) return;

    const currentWaypoint = mission.waypoints[currentWaypointIndex];
    const nextWaypoint = mission.waypoints[currentWaypointIndex + 1];
    
    if (nextWaypoint) {
      // Interpolate between waypoints
      const progress = (simulationStep % 10) / 10;
      const currentPos = transformCoord(currentWaypoint.coordinates);
      const nextPos = transformCoord(nextWaypoint.coordinates);
      
      setDronePosition({
        x: currentPos.x + (nextPos.x - currentPos.x) * progress,
        y: currentPos.y + (nextPos.y - currentPos.y) * progress
      });
    } else {
      // At final waypoint
      const pos = transformCoord(currentWaypoint.coordinates);
      setDronePosition(pos);
    }
  }, [currentWaypointIndex, simulationStep, mission]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentWaypointIndex(0);
    setSimulationStep(0);
    setActiveFailures([]);
    setIsPlaying(false);
  };

  const getWaypointColor = (waypoint: Waypoint) => {
    if (activeFailures.includes(waypoint.id)) return '#ff4444';
    
    switch (waypoint.waypoint_type) {
      case 'START': return '#4CAF50';
      case 'END': return '#f44336';
      case 'CHECKPOINT': return '#2196F3';
      case 'DELIVERY': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getWaypointSize = (waypoint: Waypoint) => {
    switch (waypoint.waypoint_type) {
      case 'START': return 12;
      case 'END': return 12;
      default: return 8;
    }
  };

  if (!mission) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Visual Simulation</h3>
        <p className="text-gray-600">Create a mission to see the visual simulation</p>
      </div>
    );
  }



  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Mission Visualization</h3>
        <div className="flex gap-2 items-center">
          <button
            onClick={handlePlayPause}
            className={`px-4 py-2 rounded ${isPlaying ? 'bg-red-500' : 'bg-green-500'} text-white`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
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
            className="px-2 py-1 border rounded"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Stage width={canvasWidth} height={canvasHeight}>
          <Layer>
            {/* Background grid */}
            <Group>
              {Array.from({ length: 20 }, (_, i) => (
                <Line
                  key={`grid-${i}`}
                  points={[i * 40, 0, i * 40, canvasHeight]}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: 15 }, (_, i) => (
                <Line
                  key={`grid-h-${i}`}
                  points={[0, i * 40, canvasWidth, i * 40]}
                  stroke="#f0f0f0"
                  strokeWidth={1}
                />
              ))}
            </Group>

            {/* Mission path */}
            {mission.waypoints.length > 1 && (
              <Line
                points={mission.waypoints.flatMap(wp => {
                  const pos = transformCoord(wp.coordinates);
                  return [pos.x, pos.y];
                })}
                stroke="#666"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}

            {/* Waypoints */}
            {mission.waypoints.map((waypoint, index) => {
              const pos = transformCoord(waypoint.coordinates);
              const isActive = index === currentWaypointIndex;
              const hasFailure = activeFailures.includes(waypoint.id);
              
              return (
                <Group key={waypoint.id}>
                  {/* Waypoint circle */}
                  <Circle
                    x={pos.x}
                    y={pos.y}
                    radius={getWaypointSize(waypoint)}
                    fill={getWaypointColor(waypoint)}
                    stroke={isActive ? '#000' : '#333'}
                    strokeWidth={isActive ? 3 : 1}
                  />
                  
                  {/* Failure indicator */}
                  {hasFailure && (
                    <Circle
                      x={pos.x}
                      y={pos.y}
                      radius={getWaypointSize(waypoint) + 8}
                      fill="rgba(255, 68, 68, 0.3)"
                      stroke="#ff4444"
                      strokeWidth={2}
                    />
                  )}
                  
                  {/* Waypoint label */}
                  <Text
                    x={pos.x + 15}
                    y={pos.y - 10}
                    text={`${index + 1}. ${waypoint.name}`}
                    fontSize={12}
                    fill="#333"
                    fontStyle="bold"
                  />
                  
                  {/* Altitude indicator */}
                  <Text
                    x={pos.x + 15}
                    y={pos.y + 5}
                    text={`${waypoint.altitude}m`}
                    fontSize={10}
                    fill="#666"
                  />
                </Group>
              );
            })}

            {/* Drone */}
            {mission.waypoints.length > 0 && (
              <Group>
                <Circle
                  x={dronePosition.x}
                  y={dronePosition.y}
                  radius={6}
                  fill="#FFD700"
                  stroke="#FFA500"
                  strokeWidth={2}
                />
                <Text
                  x={dronePosition.x + 10}
                  y={dronePosition.y - 5}
                  text="🛸"
                  fontSize={16}
                />
              </Group>
            )}

            {/* Legend */}
            <Group x={10} y={10}>
              <Rect
                x={0}
                y={0}
                width={200}
                height={120}
                fill="rgba(255, 255, 255, 0.9)"
                stroke="#ccc"
                strokeWidth={1}
                cornerRadius={5}
              />
              <Text x={10} y={15} text="Legend" fontSize={14} fontStyle="bold" fill="#333" />
              <Circle x={20} y={35} radius={6} fill="#4CAF50" />
              <Text x={35} y={40} text="Start" fontSize={12} fill="#333" />
              <Circle x={20} y={55} radius={6} fill="#2196F3" />
              <Text x={35} y={60} text="Checkpoint" fontSize={12} fill="#333" />
              <Circle x={20} y={75} radius={6} fill="#f44336" />
              <Text x={35} y={80} text="End" fontSize={12} fill="#333" />
              <Circle x={20} y={95} radius={6} fill="#ff4444" />
              <Text x={35} y={100} text="Failure" fontSize={12} fill="#333" />
            </Group>

            {/* Status panel */}
            <Group x={canvasWidth - 210} y={10}>
              <Rect
                x={0}
                y={0}
                width={200}
                height={80}
                fill="rgba(255, 255, 255, 0.9)"
                stroke="#ccc"
                strokeWidth={1}
                cornerRadius={5}
              />
              <Text x={10} y={15} text="Status" fontSize={14} fontStyle="bold" fill="#333" />
              <Text x={10} y={35} text={`Waypoint: ${currentWaypointIndex + 1}/${mission.waypoints.length}`} fontSize={12} fill="#333" />
              <Text x={10} y={50} text={`Step: ${simulationStep}`} fontSize={12} fill="#333" />
              <Text x={10} y={65} text={`Speed: ${simulationSpeed}x`} fontSize={12} fill="#333" />
            </Group>
          </Layer>
        </Stage>
      </div>

      {/* Mission info */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-semibold mb-2">Mission Details</h4>
          <p><strong>Name:</strong> {mission.mission_name}</p>
          <p><strong>Waypoints:</strong> {mission.waypoints.length}</p>
          <p><strong>Failure Scenarios:</strong> {mission.failure_scenarios?.length || 0}</p>
        </div>
        
        {simulationResult && (
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-semibold mb-2">Simulation Results</h4>
            <p><strong>Success Rate:</strong> {simulationResult.simulation_summary.success_rate_percentage}%</p>
            <p><strong>Total Runs:</strong> {simulationResult.simulation_summary.total_simulations}</p>
            <p><strong>Failed Runs:</strong> {simulationResult.simulation_summary.failed_runs}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSimulation; 