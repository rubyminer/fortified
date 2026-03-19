import { Link, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '⬛' },
  { path: '/workouts', label: 'Workouts', icon: '💪' },
  { path: '/movements', label: 'Movements', icon: '🏋️' },
  { path: '/disciplines', label: 'Disciplines', icon: '🏅' },
  { path: '/subtracks', label: 'Subtracks', icon: '🎯' },
  { path: '/visualizer', label: 'Visualizer', icon: '📈' },
  { path: '/users', label: 'Users', icon: '👤' },
  { path: '/community', label: 'Community', icon: '💬' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
];

function NavItem({ path, label }: { path: string; label: string }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [active] = useRoute(path);
  return (
    <Link href={path} style={{
      display: 'flex', alignItems: 'center', padding: '10px 16px',
      fontSize: 14, fontWeight: 500, textDecoration: 'none', borderRadius: 0,
      color: active ? '#F05A28' : '#888',
      background: active ? 'rgba(240,90,40,0.08)' : 'transparent',
      borderLeft: active ? '3px solid #F05A28' : '3px solid transparent',
      transition: 'all 0.15s', cursor: 'pointer',
    }}>
      {label}
    </Link>
  );
}

interface Props { children: ReactNode; section: string; }

export function Layout({ children, section }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#141414', borderRight: '1px solid #2a2a2a',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', color: '#f0f0f0' }}>
            FORTIFY
          </div>
          <div style={{ fontSize: 11, color: '#F05A28', letterSpacing: '0.1em', fontWeight: 600, marginTop: 2 }}>
            ADMIN
          </div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {NAV.map(n => <NavItem key={n.path} path={n.path} label={n.label} />)}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid #2a2a2a', fontSize: 12, color: '#666' }}>
          Admin Panel v1.0
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 56, background: '#141414', borderBottom: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{section}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {profile && (
              <span style={{ fontSize: 13, color: '#888' }}>{profile.name}</span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={signOut}>Sign Out</button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
