import { Switch, Route, Router as WouterRouter } from 'wouter';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ToastProvider } from '@/components/Toast';
import { LoginPage } from '@/pages/LoginPage';
import { Dashboard } from '@/pages/Dashboard';
import { Workouts } from '@/pages/Workouts';
import { Movements } from '@/pages/Movements';
import { Users } from '@/pages/Users';
import { Community } from '@/pages/Community';
import { Analytics } from '@/pages/Analytics';

function AppRoutes() {
  const { session, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
        <div style={{ color: '#888', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  if (session && profile && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Not Authorized</div>
        <p style={{ color: '#888', fontSize: 14 }}>You do not have admin access to this panel.</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/movements" component={Movements} />
      <Route path="/users" component={Users} />
      <Route path="/community" component={Community} />
      <Route path="/analytics" component={Analytics} />
      <Route>
        <div style={{ padding: 40, color: '#888' }}>Page not found</div>
      </Route>
    </Switch>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <ToastProvider>
      <AuthProvider>
        <WouterRouter base={base}>
          <AppRoutes />
        </WouterRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
