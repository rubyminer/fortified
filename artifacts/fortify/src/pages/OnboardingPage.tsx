import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAllSubtrackConfig, type SubtrackConfigRow } from '@/hooks/use-subtrack-config';
import { formatSessionsPerWeekLabel } from '@/lib/frequency-label';
import { populateCalendar, normalizeTimeToPg } from '@/lib/populate-calendar';
import { suggestSupplementalDays } from '@/lib/supplemental-day-suggestions';
import type { SupplementalTiming } from '@/lib/types';

interface DisciplineRow {
  id: string;
  label: string;
  sort_order: number;
}

const DAY_CHIPS: { short: string; key: string }[] = [
  { short: 'Mon', key: 'monday' },
  { short: 'Tue', key: 'tuesday' },
  { short: 'Wed', key: 'wednesday' },
  { short: 'Thu', key: 'thursday' },
  { short: 'Fri', key: 'friday' },
  { short: 'Sat', key: 'saturday' },
  { short: 'Sun', key: 'sunday' },
];

const TIMING_OPTIONS: {
  value: SupplementalTiming;
  title: string;
  sub: string;
}[] = [
  {
    value: 'same_day_before',
    title: 'Same days — before training',
    sub: 'Add your strength session to the front end of your existing gym days. Efficient if you are already going anyway.',
  },
  {
    value: 'same_day_after',
    title: 'Same days — after training',
    sub: 'Stack your strength session after your primary training. Requires good energy management.',
  },
  {
    value: 'different_days',
    title: 'Different days',
    sub: 'Keep your strength work completely separate. Best for recovery and focus.',
  },
];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: configRows = [], isLoading: configLoading } = useAllSubtrackConfig();
  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('id, label, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as DisciplineRow[];
    },
  });

  const groupedConfig = useMemo(() => {
    const order = new Map(disciplines.map((d, i) => [d.id, d.sort_order ?? i]));
    const byDisc = new Map<string, SubtrackConfigRow[]>();
    for (const row of configRows) {
      const list = byDisc.get(row.discipline) ?? [];
      list.push(row);
      byDisc.set(row.discipline, list);
    }
    for (const list of byDisc.values()) {
      list.sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    return [...byDisc.entries()]
      .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
      .map(([discipline, rows]) => ({
        discipline,
        label: disciplines.find(d => d.id === discipline)?.label ?? discipline,
        rows,
      }));
  }, [configRows, disciplines]);

  const [formData, setFormData] = useState({
    name: '',
    subtrack: '',
    primaryTrainingDays: [] as string[],
    supplementalTiming: '' as SupplementalTiming | '',
    supplementalDays: [] as string[],
    preferredWorkoutTime: '07:00',
  });

  const selectedRow = configRows.find(r => r.subtrack === formData.subtrack);
  const disciplineLabel =
    disciplines.find(d => d.id === selectedRow?.discipline)?.label ?? selectedRow?.discipline ?? 'training';

  const toggleDay = (arr: string[], key: string) =>
    arr.includes(key) ? arr.filter(d => d !== key) : [...arr, key];

  const advanceToScheduling = () => {
    if (!selectedRow) return;
    setFormData(fd => {
      const timing = fd.supplementalTiming || 'same_day_before';
      let supp = fd.supplementalDays;
      if (supp.length === 0) {
        supp =
          timing === 'different_days'
            ? suggestSupplementalDays(fd.primaryTrainingDays, selectedRow.base_days_per_week)
            : [...fd.primaryTrainingDays];
      }
      return { ...fd, supplementalTiming: timing, supplementalDays: supp };
    });
    setStep(4);
  };

  const handleSubmitProfile = async () => {
    if (!user || !selectedRow) return;
    if (!formData.supplementalTiming) {
      toast.error('Choose when you want strength work.');
      return;
    }
    if (formData.supplementalDays.length === 0) {
      toast.error('Select at least one day for strength sessions.');
      return;
    }
    setIsSubmitting(true);
    try {
      const cycleStart = new Date();
      const cycleStr = format(cycleStart, 'yyyy-MM-dd');
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';

      const { error } = await supabase.from('profiles').insert([
        {
          id: user.id,
          name: formData.name,
          discipline: selectedRow.discipline,
          subtrack: selectedRow.subtrack,
          level: 'intermediate',
          frequency: selectedRow.base_days_per_week,
          is_beta: true,
          primary_training_days: formData.primaryTrainingDays,
          supplemental_timing: formData.supplementalTiming,
          supplemental_days: formData.supplementalDays,
          preferred_workout_time: normalizeTimeToPg(formData.preferredWorkoutTime),
          cycle_start_date: cycleStr,
          notification_timezone: tz,
        },
      ]);
      if (error) throw error;

      const pop = await populateCalendar(supabase, {
        userId: user.id,
        discipline: selectedRow.discipline,
        subtrack: selectedRow.subtrack,
        supplementalDays: formData.supplementalDays,
        preferredWorkoutTime: formData.preferredWorkoutTime,
        cycleStartDate: cycleStart,
        replaceFutureIncomplete: true,
      });
      if ('error' in pop) {
        toast.error(pop.error);
        throw new Error(pop.error);
      }

      setStep(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishReminders = async (enabledPush: boolean) => {
    if (enabledPush) {
      try {
        await trySubscribePush(user!.id);
      } catch {
        /* optional */
      }
    }
    await refreshProfile();
    toast.success('Welcome to Fortify!');
    setLocation('/feed');
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  if (step === 5 && user) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6 justify-center max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="text-3xl font-display uppercase tracking-wider text-white">Stay on track</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Get reminded before each session so you never miss a workout.
          </p>
          <Button
            className="w-full h-14 text-lg"
            onClick={() => void finishReminders(true)}
          >
            Turn on reminders
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
            onClick={() => void finishReminders(false)}
          >
            No thanks
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto justify-center relative">
        <div className="absolute top-10 left-0 right-0">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1.5 flex-1 mx-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-secondary'}`}
              />
            ))}
          </div>
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mt-4">
            Step {step} of 4
          </p>
        </div>

        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full mt-24"
          >
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Athlete Profile</h2>
                <p className="text-muted-foreground">What should we call you on the leaderboard?</p>
                <Input
                  autoFocus
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="h-14 text-lg"
                  onKeyDown={e => e.key === 'Enter' && formData.name.trim() && setStep(2)}
                />
                <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.name.trim()}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-display uppercase tracking-wider">Starting Track</h2>
                  <p className="text-muted-foreground mt-2">
                    Pick a focus area to begin. You can switch at any time.
                  </p>
                </div>

                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Loading tracks…</p>
                ) : groupedConfig.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No track configuration found. Ask your coach to seed{' '}
                    <code className="text-xs">subtrack_config</code> in Supabase.
                  </p>
                ) : (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                    {groupedConfig.map(({ discipline, label, rows }) => (
                      <div key={discipline}>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {label}
                        </p>
                        <div className="space-y-2">
                          {rows.map(row => {
                            const freq = formatSessionsPerWeekLabel(
                              row.base_days_per_week,
                              row.flex_days_per_week,
                            );
                            const selected = formData.subtrack === row.subtrack;
                            return (
                              <Card
                                key={row.id}
                                className={`cursor-pointer transition-all duration-200 ${
                                  selected
                                    ? 'border-primary ring-1 ring-primary/50 bg-primary/10'
                                    : 'hover:border-white/20'
                                }`}
                                onClick={() => setFormData({ ...formData, subtrack: row.subtrack })}
                              >
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-display text-lg text-white">{row.display_name}</h3>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase tracking-wider border-primary/40 text-primary/90"
                                      >
                                        {freq}
                                      </Badge>
                                      {selected && (
                                        <div className="w-3 h-3 rounded-full bg-primary" aria-hidden />
                                      )}
                                    </div>
                                  </div>
                                  {row.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {row.description}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={!formData.subtrack || configRows.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-display uppercase tracking-wider">
                    When do you train {disciplineLabel}?
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Select all the days you typically train your primary discipline.
                  </p>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  {DAY_CHIPS.map(({ short, key }) => {
                    const on = formData.primaryTrainingDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData(fd => ({
                            ...fd,
                            primaryTrainingDays: toggleDay(fd.primaryTrainingDays, key),
                          }))
                        }
                        className={`flex-1 min-w-[40px] py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                          on
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card/60 border-white/10 text-muted-foreground'
                        }`}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={advanceToScheduling}
                    disabled={formData.primaryTrainingDays.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 max-h-[calc(100dvh-180px)] overflow-y-auto pr-1">
                <div>
                  <h2 className="text-3xl font-display uppercase tracking-wider">When do you want strength work?</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    We will schedule sessions on the days you confirm below.
                  </p>
                </div>

                <div className="space-y-2">
                  {TIMING_OPTIONS.map(opt => (
                    <Card
                      key={opt.value}
                      className={`cursor-pointer transition-all ${
                        formData.supplementalTiming === opt.value
                          ? 'border-primary ring-1 ring-primary/40 bg-primary/10'
                          : 'border-white/10 bg-card/40'
                      }`}
                      onClick={() => {
                        setFormData(fd => {
                          let supp = fd.supplementalDays;
                          if (opt.value === 'different_days') {
                            supp = suggestSupplementalDays(
                              fd.primaryTrainingDays,
                              selectedRow?.base_days_per_week ?? 2,
                            );
                          } else {
                            supp = [...fd.primaryTrainingDays];
                          }
                          return { ...fd, supplementalTiming: opt.value, supplementalDays: supp };
                        });
                      }}
                    >
                      <CardContent className="p-4 space-y-1">
                        <h3 className="font-semibold text-white text-sm">{opt.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{opt.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {formData.supplementalTiming === 'different_days' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      We suggest these days for best recovery — adjust if needed.
                    </p>
                    <div className="flex flex-wrap justify-between gap-2">
                      {DAY_CHIPS.map(({ short, key }) => {
                        const disabled = formData.primaryTrainingDays.includes(key);
                        const on = formData.supplementalDays.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              !disabled &&
                              setFormData(fd => ({
                                ...fd,
                                supplementalDays: toggleDay(fd.supplementalDays, key),
                              }))
                            }
                            className={`flex-1 min-w-[40px] py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                              disabled
                                ? 'opacity-30 cursor-not-allowed border-white/5 bg-black/20'
                                : on
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card/60 border-white/10 text-muted-foreground'
                            }`}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(formData.supplementalTiming === 'same_day_before' ||
                  formData.supplementalTiming === 'same_day_after') && (
                  <div className="space-y-2">
                    <p className="text-xs text-primary/80">We will schedule your strength sessions on these days.</p>
                    <div className="flex flex-wrap justify-between gap-2">
                      {DAY_CHIPS.map(({ short, key }) => {
                        const on = formData.supplementalDays.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setFormData(fd => ({
                                ...fd,
                                supplementalDays: toggleDay(fd.supplementalDays, key),
                              }))
                            }
                            className={`flex-1 min-w-[40px] py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                              on
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card/60 border-white/10 text-muted-foreground'
                            }`}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    What time do you usually work out?
                  </label>
                  <Input
                    type="time"
                    value={formData.preferredWorkoutTime}
                    onChange={e => setFormData({ ...formData, preferredWorkoutTime: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">We will remind you 1 hour before.</p>
                </div>

                <div className="flex gap-3 pb-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => void handleSubmitProfile()}
                    disabled={
                      !formData.supplementalTiming ||
                      formData.supplementalDays.length === 0 ||
                      isSubmitting ||
                      !selectedRow
                    }
                  >
                    {isSubmitting ? 'Saving…' : 'Create profile'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function trySubscribePush(userId: string): Promise<void> {
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapid || typeof Notification === 'undefined') return;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!('PushManager' in window)) return;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
  });
  const j = sub.toJSON();
  if (!j.keys?.p256dh || !j.keys?.auth || !j.endpoint) return;
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
    },
    { onConflict: 'user_id,endpoint' },
  );
}
