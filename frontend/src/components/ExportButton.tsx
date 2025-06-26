import React from "react";

interface Props {
  missionName: string;
  waypoints: any[];
  failureScenarios: any[];
}

const ExportButton: React.FC<Props> = ({ missionName, waypoints, failureScenarios }) => {
  const handleExport = () => {
    const data = { missionName, waypoints, failureScenarios };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mission.json";
    a.click();
  };

  return <button onClick={handleExport}>Export Mission</button>;
};

export default ExportButton; 