import { useAuth } from '@/hooks/use-auth';
import { useRecentSessions } from '@/hooks/use-workouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon, Settings, Calendar, Award } from 'lucide-react';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const { data: sessions } = useRecentSessions(profile?.id);

  const formatSport = (str: string) => str?.toUpperCase();
  const formatSubtrack = (str: string) => str?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-4xl font-display text-white tracking-wide">Athlete Profile</h1>
      </header>

      <Card className="bg-gradient-to-br from-card to-background border-white/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/10 shadow-xl">
              <UserIcon className="w-8 h-8 text-white/50" />
            </div>
            <div>
              <h2 className="text-2xl font-display tracking-wide text-white">{profile?.name}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant="accent" className="bg-accent/20 text-accent hover:bg-accent/30">{formatSport(profile?.sport || '')}</Badge>
                <Badge variant="outline" className="capitalize text-white/70">{profile?.level}</Badge>
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Current Track</div>
            <div className="text-white font-semibold">{formatSubtrack(profile?.subtrack || '')}</div>
            <div className="text-xs text-primary mt-1 font-bold">{profile?.frequency} Days / Week</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/40 border-white/5">
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Calendar className="w-6 h-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-display text-white">{sessions?.length || 0}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Sessions</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/5">
          <CardContent className="p-5 flex flex-col items-center text-center">
            <Award className="w-6 h-6 text-accent mb-2" />
            <div className="text-2xl font-display text-white capitalize">{profile?.level}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Status</div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 space-y-3">
        <Button variant="outline" className="w-full justify-start h-14" disabled>
          <Settings className="w-5 h-5 mr-3 text-muted-foreground" /> 
          Account Settings (Coming Soon)
        </Button>
        <Button variant="destructive" className="w-full justify-start h-14 bg-red-950/40 text-red-500 hover:bg-red-900/60 border border-red-900/30" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-3" /> 
          Sign Out
        </Button>
      </div>
    </div>
  );
}
