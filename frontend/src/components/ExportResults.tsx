import React, { useState } from "react";
import axios from "axios";

interface Props {
  mission: any;
}

const ExportResults: React.FC<Props> = ({ mission }) => {
  const [csv, setCsv] = useState("");
  const [heatmapHtml, setHeatmapHtml] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8001/simulate/export", mission);
      setCsv(res.data.csv);
      setHeatmapHtml(res.data.heatmap_html);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleExport} disabled={loading || !mission}>Export CSV & Heatmap</button>
      {csv && (
        <div>
          <h3>CSV Export</h3>
          <textarea value={csv} readOnly rows={8} style={{ width: "100%" }} />
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="simulation_results.csv"
          >
            Download CSV
          </a>
        </div>
      )}
      {heatmapHtml && (
        <div>
          <h3>Failure Heatmap</h3>
          <div dangerouslySetInnerHTML={{ __html: heatmapHtml }} />
        </div>
      )}
    </div>
  );
};

export default ExportResults; 