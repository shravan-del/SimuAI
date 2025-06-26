import React, { useEffect, useState } from "react";
import axios from "axios";

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:8001/simulate/history?limit=10")
      .then(res => setHistory(res.data.history))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3>Simulation History</h3>
      {loading ? <div>Loading...</div> : (
        <ul>
          {history.map((entry, idx) => (
            <li key={idx}>
              <b>{entry.mission_name}</b> at {entry.timestamp} — Success Rate: {entry.simulation_summary?.success_rate_percentage}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History; 