// src/context/UploadContext.js
import React, { createContext, useState, useContext } from "react";

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [uploadStatus, setUploadStatus] = useState(null);

  return (
    <UploadContext.Provider value={{ uploadStatus, setUploadStatus }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
