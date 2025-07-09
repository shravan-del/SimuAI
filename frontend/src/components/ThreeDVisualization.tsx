import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

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

interface Mission {
  mission_name: string;
  waypoints: Waypoint[];
  failure_scenarios: any[];
}

interface Props {
  mission: Mission | null;
  isPlaying: boolean;
  currentWaypointIndex: number;
  simulationStep: number;
}

// Drone component
const Drone: React.FC<{ position: [number, number, number]; isActive: boolean }> = ({ position, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      {/* Drone body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color={isActive ? "#FFD700" : "#FFA500"} />
      </mesh>
      
      {/* Drone rotors */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Status indicator */}
      {isActive && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
};

// Waypoint component
const Waypoint3D: React.FC<{
  waypoint: Waypoint;
  index: number;
  isActive: boolean;
  hasFailure: boolean;
  onClick: () => void;
}> = ({ waypoint, index, isActive, hasFailure, onClick }) => {
  const getColor = () => {
    if (hasFailure) return "#ff4444";
    switch (waypoint.waypoint_type) {
      case 'START': return "#4CAF50";
      case 'END': return "#f44336";
      case 'CHECKPOINT': return "#2196F3";
      case 'DELIVERY': return "#FF9800";
      default: return "#9E9E9E";
    }
  };

  const getSize = () => {
    switch (waypoint.waypoint_type) {
      case 'START': return 0.8;
      case 'END': return 0.8;
      default: return 0.5;
    }
  };

  return (
    <group 
      position={[waypoint.coordinates.x, waypoint.coordinates.y, waypoint.coordinates.z]}
      onClick={onClick}
    >
      {/* Waypoint sphere */}
      <Sphere args={[getSize(), 16, 16]}>
        <meshStandardMaterial 
          color={getColor()} 
          emissive={isActive ? getColor() : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </Sphere>
      
      {/* Failure indicator */}
      {hasFailure && (
        <Sphere args={[getSize() + 0.3, 16, 16]}>
          <meshStandardMaterial 
            color="#ff4444" 
            transparent 
            opacity={0.3}
            emissive="#ff4444"
            emissiveIntensity={0.2}
          />
        </Sphere>
      )}
      
      {/* Waypoint label */}
      <Html position={[0, getSize() + 0.5, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {index + 1}. {waypoint.name}
        </div>
      </Html>
      
      {/* Altitude indicator */}
      <Html position={[0, -getSize() - 0.3, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {waypoint.altitude}m
        </div>
      </Html>
    </group>
  );
};

// Mission path component
const MissionPath: React.FC<{ waypoints: Waypoint[] }> = ({ waypoints }) => {
  if (waypoints.length < 2) return null;

  const points = waypoints.map(wp => new THREE.Vector3(
    wp.coordinates.x,
    wp.coordinates.y,
    wp.coordinates.z
  ));

  return (
    <Line
      points={points}
      color="#666"
      lineWidth={3}
      dashed
      dashSize={1}
      gapSize={0.5}
    />
  );
};

// Scene component
const Scene: React.FC<Props> = ({ mission, isPlaying, currentWaypointIndex, simulationStep }) => {
  const { camera } = useThree();
  const [activeFailures, setActiveFailures] = useState<string[]>([]);
  const [dronePosition, setDronePosition] = useState<[number, number, number]>([0, 0, 0]);

  // Update drone position based on simulation
  useEffect(() => {
    if (!mission?.waypoints.length) return;

    const currentWaypoint = mission.waypoints[currentWaypointIndex];
    const nextWaypoint = mission.waypoints[currentWaypointIndex + 1];
    
    if (nextWaypoint) {
      // Interpolate between waypoints
      const progress = (simulationStep % 10) / 10;
      const currentPos = currentWaypoint.coordinates;
      const nextPos = nextWaypoint.coordinates;
      
      setDronePosition([
        currentPos.x + (nextPos.x - currentPos.x) * progress,
        currentPos.y + (nextPos.y - currentPos.y) * progress,
        currentPos.z + (nextPos.z - currentPos.z) * progress
      ]);
    } else {
      // At final waypoint
      const pos = currentWaypoint.coordinates;
      setDronePosition([pos.x, pos.y, pos.z]);
    }
  }, [currentWaypointIndex, simulationStep, mission]);

  // Simulate failures
  useEffect(() => {
    if (!mission?.failure_scenarios) return;
    
    const failures = mission.failure_scenarios
      .filter(scenario => Math.random() < scenario.probability)
      .flatMap(scenario => scenario.affected_waypoint_ids);
    
    setActiveFailures(failures);
  }, [simulationStep, mission]);

  // Auto-rotate camera when not playing
  useFrame((state) => {
    if (!isPlaying) {
      camera.position.x = Math.sin(state.clock.elapsedTime * 0.2) * 20;
      camera.position.z = Math.cos(state.clock.elapsedTime * 0.2) * 20;
      camera.lookAt(0, 0, 0);
    }
  });

  if (!mission) return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Grid */}
      <gridHelper args={[50, 50, "#444", "#666"]} />
      
      {/* Mission path */}
      <MissionPath waypoints={mission.waypoints} />
      
      {/* Waypoints */}
      {mission.waypoints.map((waypoint, index) => (
        <Waypoint3D
          key={waypoint.id}
          waypoint={waypoint}
          index={index}
          isActive={index === currentWaypointIndex}
          hasFailure={activeFailures.includes(waypoint.id)}
          onClick={() => console.log(`Clicked waypoint: ${waypoint.name}`)}
        />
      ))}
      
      {/* Drone */}
      <Drone 
        position={dronePosition} 
        isActive={isPlaying} 
      />
      
      {/* Environment */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
    </>
  );
};

const ThreeDVisualization: React.FC<Props> = (props) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">3D Mission Visualization</h3>
        <div className="text-sm text-gray-600">
          Use mouse to rotate, scroll to zoom
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <Canvas
          camera={{ position: [15, 15, 15], fov: 60 }}
          style={{ background: 'linear-gradient(to bottom, #87CEEB, #98FB98)' }}
        >
          <Scene {...props} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={50}
            minDistance={5}
          />
        </Canvas>
      </div>
      
      {/* Controls info */}
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Controls:</strong> Left click + drag to rotate • Scroll to zoom • Right click + drag to pan</p>
        <p><strong>Legend:</strong> 🟢 Start • 🔵 Checkpoint • 🔴 End • 🟠 Delivery • ⚠️ Failure</p>
      </div>
    </div>
  );
};

export default ThreeDVisualization; 