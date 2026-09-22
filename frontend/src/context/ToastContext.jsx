import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const mostrarToast = useCallback((mensaje, tipo = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const iconos = { success: "bi-check-circle-fill", error: "bi-x-circle-fill", info: "bi-info-circle-fill" };
  const colores = { success: "success", error: "danger", info: "primary" };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item d-flex align-items-center text-white bg-${colores[t.tipo]} rounded-3 shadow-lg px-3 py-2 mb-2`}
          >
            <i className={`bi ${iconos[t.tipo]} me-2 fs-5`}></i>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}