import { Link, useLocation } from 'wouter';
import { Dumbbell, Home, MessageCircle, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Dumbbell, label: 'Library', path: '/movements' },
    { icon: Trophy, label: 'PRs', path: '/prs' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground pb-[80px]">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /></svg>
          </div>
          <h1 className="text-2xl font-display text-white tracking-widest mt-1">FORTIFY</h1>
        </div>
        {profile && (
          <div className="text-xs uppercase tracking-widest text-primary font-bold">
            {profile.sport}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-2xl border-t border-white/5 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} className="flex-1 flex justify-center">
                <div className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 w-full py-2",
                  isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-white"
                )}>
                  <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(255,85,0,0.8)]")} />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
