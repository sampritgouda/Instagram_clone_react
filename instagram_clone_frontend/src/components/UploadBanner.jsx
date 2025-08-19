// src/components/UploadBanner.js
import React from "react";
import { useUpload } from "../context/UploadContext";

export default function UploadBanner() {
  const { uploadStatus } = useUpload();

  if (!uploadStatus) return null; // Don't show if nothing is uploading

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        background: "rgba(0,0,0,0.85)",
        color: "white",
        padding: "8px",
        textAlign: "center",
        zIndex: 2000,
      }}
    >
      {uploadStatus}
    </div>
  );
}
