import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRecentSessions } from '@/hooks/use-workouts';
import { useSubtracks } from '@/hooks/use-subtracks';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, User as UserIcon, Calendar, Award, CheckCircle2 } from 'lucide-react';

const DISCIPLINE_COLORS: Record<string, string> = {
  crossfit: '#F05A28',
  hyrox: '#3b82f6',
  athx: '#a855f7',
};
const DEFAULT_COLOR = '#888888';

function disciplineColor(id: string): string {
  return DISCIPLINE_COLORS[id] ?? DEFAULT_COLOR;
}

export default function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { data: sessions } = useRecentSessions(profile?.id);
  const { data: subtracks = [] } = useSubtracks();
  const [saving, setSaving] = useState(false);

  const formatSubtrack = (str: string) =>
    str?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  async function handleChangeDiscipline(discipline: string) {
    if (!profile || discipline === profile.discipline || saving) return;
    setSaving(true);
    try {
      const firstSubtrack = subtracks.find(g => g.discipline === discipline)?.subtracks[0];
      const { error } = await supabase
        .from('profiles')
        .update({ discipline, subtrack: firstSubtrack?.id ?? null })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(`Switched to ${discipline.charAt(0).toUpperCase() + discipline.slice(1)}`);
    } catch {
      toast.error('Failed to update discipline. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-4xl font-display text-white tracking-wide">Athlete Profile</h1>
      </header>

      {/* Identity card */}
      <Card className="bg-gradient-to-br from-card to-background border-white/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/10 shadow-xl">
              <UserIcon className="w-8 h-8 text-white/50" />
            </div>
            <div>
              <h2 className="text-2xl font-display tracking-wide text-white">{profile?.name}</h2>
              <div className="flex gap-2 mt-1">
                <Badge
                  variant="accent"
                  className="capitalize"
                  style={{ background: `${disciplineColor(profile?.discipline ?? '')}20`, color: disciplineColor(profile?.discipline ?? '') }}
                >
                  {profile?.discipline}
                </Badge>
                <Badge variant="outline" className="capitalize text-white/70">{profile?.level}</Badge>
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Current Track</div>
            <div className="text-white font-semibold">{formatSubtrack(profile?.subtrack || '')}</div>
            <div className="text-xs mt-1 font-bold" style={{ color: disciplineColor(profile?.discipline ?? '') }}>
              {profile?.frequency} Days / Week
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
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

      {/* Training Discipline selector */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Training Discipline</h2>
        <div className="space-y-2">
          {subtracks.map(({ discipline, label }) => {
            const isActive = profile?.discipline === discipline;
            const color = disciplineColor(discipline);
            return (
              <button
                key={discipline}
                onClick={() => handleChangeDiscipline(discipline)}
                disabled={saving || isActive}
                className="w-full text-left rounded-2xl border transition-all duration-200 p-4 flex items-center justify-between"
                style={{
                  background: isActive ? `${color}12` : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? `${color}50` : 'rgba(255,255,255,0.08)',
                  opacity: saving && !isActive ? 0.5 : 1,
                }}
              >
                <div>
                  <div className="font-display text-lg text-white tracking-wide">{label}</div>
                </div>
                {isActive && (
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color }} />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Switching discipline resets your active track to the first available track for that discipline.
        </p>
      </div>

      {/* Sign out */}
      <div className="pt-2">
        <Button
          variant="destructive"
          className="w-full justify-start h-14 bg-red-950/40 text-red-500 hover:bg-red-900/60 border border-red-900/30"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
