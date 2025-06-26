import React from "react";

interface Props {
  result: any;
}

const SimulationResults: React.FC<Props> = ({ result }) => {
  if (!result) return null;
  return (
    <div>
      <h2>Simulation Results</h2>
      <pre style={{ background: '#f4f4f4', padding: 10 }}>{JSON.stringify(result, null, 2)}</pre>
      {/* You can add more detailed rendering here */}
    </div>
  );
};

export default SimulationResults; 