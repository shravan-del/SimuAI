import React from "react";

const UploadMap: React.FC = () => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("map", file);
    await fetch("http://localhost:8001/upload/map", { method: "POST", body: formData });
    alert("Map uploaded!");
  };

  return <input type="file" accept="image/*" onChange={handleUpload} />;
};

export default UploadMap; 