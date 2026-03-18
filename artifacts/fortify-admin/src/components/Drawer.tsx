import { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ open, title, onClose, footer, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 600,
        background: '#141414', borderLeft: '1px solid #2a2a2a',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        animation: 'drawerIn 0.2s ease'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #2a2a2a', flexShrink: 0
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0,
            background: '#141414', display: 'flex', gap: 10, justifyContent: 'flex-end'
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
