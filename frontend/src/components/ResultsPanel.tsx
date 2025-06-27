import React from 'react';

interface FailureStat {
  type: string;
  count: number;
}

interface SimulationResults {
  successRate: number;
  topFailures: FailureStat[];
  suggestion: string;
}

const ResultsPanel: React.FC<{ results: SimulationResults }> = ({ results }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Simulation Results</h2>
      <p className="text-xl">Success Rate: {results.successRate}%</p>
      <h3 className="mt-4 font-semibold">Top Failures:</h3>
      <ul>
        {results.topFailures.map((fail, i) => (
          <li key={i}>{fail.type} – {fail.count} occurrences</li>
        ))}
      </ul>
      <h3 className="mt-4 font-semibold">Suggested Fix:</h3>
      <p>{results.suggestion}</p>
    </div>
  );
};

export default ResultsPanel; 