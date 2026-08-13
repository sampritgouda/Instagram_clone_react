import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-success" />;
      case "error":
        return <AlertCircle size={20} className="text-danger" />;
      case "warning":
        return <AlertTriangle size={20} className="text-warning" />;
      case "info":
      default:
        return <Info size={20} className="text-info" />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 999999 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item d-flex align-items-start p-3 mb-2 rounded shadow-lg text-white type-${toast.type}`}
            role="alert"
          >
            <div className="toast-icon me-3 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="toast-message flex-grow-1" style={{ fontSize: "14px", lineHeight: "1.4" }}>
              {toast.message}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white ms-2 p-1"
              onClick={() => removeToast(toast.id)}
              style={{ fontSize: "10px" }}
              aria-label="Close"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
