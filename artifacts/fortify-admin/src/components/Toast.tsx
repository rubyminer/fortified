import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

interface ToastCtx { showToast: (message: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const colors: Record<ToastType, string> = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#F05A28',
  };

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#1a1a1a', border: `1px solid ${colors[t.type]}`,
            borderLeft: `3px solid ${colors[t.type]}`,
            color: '#f0f0f0', padding: '10px 16px', borderRadius: 8,
            fontSize: 14, fontWeight: 500, maxWidth: 360,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.2s ease',
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </Ctx.Provider>
  );
}

export function useToast() { return useContext(Ctx); }
