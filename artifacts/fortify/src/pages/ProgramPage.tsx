import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
} from 'date-fns';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSubtrackConfig } from '@/hooks/use-subtrack-config';
import { formatCycleHeaderLabel } from '@/lib/frequency-label';
import { subtrackLabel } from '@/lib/subtracks';
import {
  useScheduledSessionsInRange,
  useProgramSummary,
  useUpcomingScheduledSessions,
  useUpdateScheduledSession,
} from '@/hooks/use-scheduled-sessions';
import type { ScheduledSessionWithWorkout } from '@/hooks/use-scheduled-sessions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, CheckCircle2, GripVertical } from 'lucide-react';
import { estimateWorkoutMinutes } from '@/lib/workout-duration';
import { cn } from '@/lib/utils';

type ViewMode = 'week' | 'month';

function DraggableSessionCard({
  row,
  children,
  disabled,
}: {
  row: ScheduledSessionWithWorkout;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sess-${row.id}`,
    disabled,
  });
  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-60')}>
      <div className="flex gap-1 items-stretch">
        {!disabled && (
          <button
            type="button"
            className="shrink-0 px-0.5 text-muted-foreground touch-none"
            {...listeners}
            {...attributes}
            aria-label="Drag to reschedule"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

/** Full-width row per day — better for portrait phones than 7 narrow columns. */
function DayDropRow({ date, children }: { date: Date; children: React.ReactNode }) {
  const id = `day-${format(date, 'yyyy-MM-dd')}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border border-white/10 bg-card/20 p-3 transition-colors',
        isOver && 'bg-primary/10 border-primary/40 ring-1 ring-primary/25',
      )}
    >
      {children}
    </div>
  );
}

export default function ProgramPage() {
  const { profile } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<ViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [pendingMove, setPendingMove] = useState<{
    sessionId: string;
    fromDate: string;
    toDate: string;
    weekStart: Date;
  } | null>(null);
  const [consecutiveWarn, setConsecutiveWarn] = useState<string | null>(null);

  const cycleStart = profile?.cycle_start_date ? parseISO(profile.cycle_start_date) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const minWeekStart = startOfWeek(cycleStart, { weekStartsOn: 1 });
  const thisWeekMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const visibleWeekStart = addWeeks(thisWeekMonday, weekOffset);

  const from = format(visibleWeekStart, 'yyyy-MM-dd');
  const to = format(addDays(visibleWeekStart, 6), 'yyyy-MM-dd');

  const { data: sessions = [], isLoading } = useScheduledSessionsInRange(profile?.id, from, to);
  const { data: config } = useSubtrackConfig(profile?.discipline, profile?.subtrack);
  const { data: summary } = useProgramSummary(profile?.id, profile?.discipline, profile?.subtrack);
  const { data: upcoming = [] } = useUpcomingScheduledSessions(profile?.id, 5);
  const updateSession = useUpdateScheduledSession();

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const { data: monthSessions = [] } = useScheduledSessionsInRange(
    profile?.id,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd'),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const byDate = useMemo(() => {
    const m = new Map<string, ScheduledSessionWithWorkout[]>();
    for (const s of sessions) {
      const k = s.scheduled_date;
      const list = m.get(k) ?? [];
      list.push(s);
      m.set(k, list);
    }
    return m;
  }, [sessions]);

  const monthDots = useMemo(() => {
    const m = new Map<string, { base: number; flexU: number; flexC: number; done: number }>();
    for (const s of monthSessions) {
      const k = s.scheduled_date;
      const cur = m.get(k) ?? { base: 0, flexU: 0, flexC: 0, done: 0 };
      if (s.completed) cur.done += 1;
      else if (s.is_flex_day && !s.is_confirmed) cur.flexU += 1;
      else if (s.is_flex_day) cur.flexC += 1;
      else cur.base += 1;
      m.set(k, cur);
    }
    return m;
  }, [monthSessions]);

  const headerLabel =
    config != null
      ? formatCycleHeaderLabel(config.base_days_per_week, config.flex_days_per_week, config.total_weeks)
      : 'Your program';

  const canPrevWeek = !isBefore(addWeeks(visibleWeekStart, -1), minWeekStart);

  function sessionsOnDate(userId: string, dateStr: string, excludeId?: string) {
    return sessions.filter(s => s.user_id === userId && s.scheduled_date === dateStr && s.id !== excludeId);
  }

  function hasAdjacentStrength(userId: string, dateStr: string, excludeId?: string) {
    const d = parseISO(dateStr);
    const prev = format(addDays(d, -1), 'yyyy-MM-dd');
    const next = format(addDays(d, 1), 'yyyy-MM-dd');
    const others = [...sessionsOnDate(userId, prev, excludeId), ...sessionsOnDate(userId, next, excludeId)];
    return others.some(s => !s.completed && (s.is_confirmed || !s.is_flex_day));
  }

  async function applyMove(sessionId: string, fromDate: string, toDate: string, weekStart: Date) {
    if (!profile) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (isBefore(parseISO(toDate), parseISO(todayStr))) return;
    const ws = startOfWeek(parseISO(fromDate), { weekStartsOn: 1 });
    if (!isSameDay(ws, weekStart)) return;

    const targetWeekStart = startOfWeek(parseISO(toDate), { weekStartsOn: 1 });
    if (!isSameDay(targetWeekStart, weekStart)) return;

    const others = sessionsOnDate(profile.id, toDate, sessionId).filter(
      s => !s.completed && (s.is_confirmed || !s.is_flex_day),
    );
    if (others.length > 0) {
      setPendingMove({ sessionId, fromDate, toDate, weekStart });
      return;
    }

    if (hasAdjacentStrength(profile.id, toDate, sessionId)) {
      setConsecutiveWarn(toDate);
    } else {
      setConsecutiveWarn(null);
    }

    await updateSession.mutateAsync({
      id: sessionId,
      scheduled_date: toDate,
      rescheduled_from: fromDate,
    });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const overId = e.over?.id?.toString();
    const activeId = e.active.id?.toString();
    if (!overId?.startsWith('day-') || !activeId?.startsWith('sess-')) return;
    const toDate = overId.slice(4);
    const sessionId = activeId.slice(5);
    const row = sessions.find(s => s.id === sessionId);
    if (!row || !profile) return;
    if (row.scheduled_date === toDate) return;
    const draggable = (!row.is_flex_day || row.is_confirmed) && !row.completed;
    if (!draggable) return;
    await applyMove(sessionId, row.scheduled_date, toDate, visibleWeekStart);
  }

  async function confirmConflictMove() {
    if (!pendingMove || !profile) return;
    await updateSession.mutateAsync({
      id: pendingMove.sessionId,
      scheduled_date: pendingMove.toDate,
      rescheduled_from: pendingMove.fromDate,
    });
    setPendingMove(null);
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setLocation('/feed')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Feed
        </Button>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button
            type="button"
            className={cn('px-3 py-1.5 text-xs font-bold uppercase', view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={cn('px-3 py-1.5 text-xs font-bold uppercase', view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{profile.discipline}</p>
            <h2 className="text-xl font-display text-white">{subtrackLabel(profile.subtrack)}</h2>
          </div>
          <span className="text-[10px] text-muted-foreground text-right">{headerLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {summary ? (
            <>
              <span className="text-white font-semibold">{summary.completed}</span> completed ·{' '}
              <span className="text-white font-semibold">{summary.planned}</span> scheduled
            </>
          ) : (
            '—'
          )}
        </p>
      </section>

      {consecutiveWarn && (
        <p className="text-xs text-amber-500/90 px-1">
          Heads up — consecutive strength days can affect recovery.
        </p>
      )}

      {view === 'week' && (
        <DndContext sensors={sensors} onDragEnd={e => void handleDragEnd(e)}>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              disabled={!canPrevWeek}
              onClick={() => setWeekOffset(o => o - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-white text-center px-2">
              {format(visibleWeekStart, 'MMM d')} – {format(addDays(visibleWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => setWeekOffset(o => o + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(visibleWeekStart, i);
              const ds = format(date, 'yyyy-MM-dd');
              const isToday = isSameDay(date, new Date());
              const dayRows = byDate.get(ds) ?? [];
              return (
                <DayDropRow key={ds} date={date}>
                  <div className="flex gap-3 items-start">
                    <div
                      className={cn(
                        'shrink-0 w-[3.25rem] pt-0.5 text-center rounded-lg py-2 px-1',
                        isToday ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-black/20',
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold leading-none">
                        {format(date, 'EEE')}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-display leading-tight mt-1',
                          isToday ? 'text-primary font-bold' : 'text-white',
                        )}
                      >
                        {format(date, 'd')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {isLoading ? (
                        <span className="text-xs text-muted-foreground py-2">…</span>
                      ) : dayRows.length === 0 ? (
                        <p className="text-xs text-muted-foreground/80 py-2">Rest day</p>
                      ) : (
                        dayRows.map(row => (
                          <SessionCardInner
                            key={row.id}
                            row={row}
                            layout="row"
                            onConfirmFlex={() =>
                              updateSession.mutate({ id: row.id, is_confirmed: true })
                            }
                            DraggableWrap={
                              (!row.is_flex_day || row.is_confirmed) && !row.completed
                                ? DraggableSessionCard
                                : undefined
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </DayDropRow>
              );
            })}
          </div>
        </DndContext>
      )}

      {view === 'month' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMonthCursor(d => addMonths(d, -1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-white">{format(monthCursor, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMonthCursor(d => addMonths(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Calendar
            mode="single"
            month={monthCursor}
            onMonthChange={setMonthCursor}
            className="w-full p-0 [--cell-size:2.25rem]"
            components={{
              DayButton: props => {
                const d = props.day.date;
                const ds = format(d, 'yyyy-MM-dd');
                const dots = monthDots.get(ds);
                const hasDots =
                  !!dots && dots.base + dots.flexU + dots.flexC + dots.done > 0;
                return (
                  <div className="flex h-full w-full flex-col items-stretch justify-end gap-0.5">
                    <CalendarDayButton
                      {...props}
                      className={cn(props.className, 'min-h-0 flex-1')}
                      onClick={e => {
                        props.onClick?.(e);
                        if (hasDots) {
                          setView('week');
                          const mon = startOfWeek(d, { weekStartsOn: 1 });
                          const diff = Math.round(
                            (mon.getTime() - thisWeekMonday.getTime()) / (7 * 86400000),
                          );
                          setWeekOffset(diff);
                        }
                      }}
                    />
                    {hasDots && (
                      <span className="flex gap-0.5 justify-center pb-0.5">
                        {dots!.done > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {dots!.base > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {dots!.flexC > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50 ring-1 ring-primary" />
                        )}
                        {dots!.flexU > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full border border-primary bg-transparent" />
                        )}
                      </span>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-lg text-white tracking-wide">Coming Up</h3>
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
          ) : (
            upcoming.map(row => {
              const w = row.workouts;
              if (!w) return null;
              const d = parseISO(row.scheduled_date);
              return (
                <Link key={row.id} href={`/workout/${w.id}`}>
                  <Card className="border-white/10 bg-card/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 flex justify-between gap-2 items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {format(d, 'EEE')} · {format(d, 'MMM d')}
                        </p>
                        <p className="text-sm font-medium text-white">{w.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px]">
                            {row.is_flex_day ? 'Flex' : 'Base'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            ~{estimateWorkoutMinutes(w)} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <AlertDialog open={!!pendingMove} onOpenChange={o => !o && setPendingMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already scheduled</AlertDialogTitle>
            <AlertDialogDescription>
              You already have a strength session on this day. Are you sure you want to move it here?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmConflictMove()}>Move anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionCardInner({
  row,
  onConfirmFlex,
  DraggableWrap,
  layout = 'column',
}: {
  row: ScheduledSessionWithWorkout;
  onConfirmFlex: () => void;
  DraggableWrap?: typeof DraggableSessionCard;
  /** `row` = full-width week list (readable titles); `column` = compact (e.g. future reuse) */
  layout?: 'row' | 'column';
}) {
  const w = row.workouts;
  if (!w) return null;
  const est = estimateWorkoutMinutes(w);
  const completed = row.completed;
  const isFlex = row.is_flex_day;
  const unconfirmedFlex = isFlex && !row.is_confirmed;
  const wide = layout === 'row';

  const inner = (
    <Card
      className={cn(
        'border py-2.5 px-3',
        completed && 'opacity-70 border-green-500/30 bg-green-500/5',
        unconfirmedFlex && 'border-dashed border-primary/40 bg-primary/[0.04]',
        !completed && !unconfirmedFlex && 'border-white/15 bg-card/80',
      )}
    >
      <CardContent className="p-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'font-semibold text-white leading-snug',
              wide ? 'text-sm' : 'text-[11px] line-clamp-2',
            )}
          >
            {w.title}
          </span>
          {completed && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
        </div>
        <p className={cn('text-muted-foreground', wide ? 'text-xs' : 'text-[9px]')}>
          Week {w.week_number} · Day {w.day_number} · ~{est} min
        </p>
        {unconfirmedFlex && (
          <div className="flex flex-wrap gap-1 items-center pt-1">
            <Badge className="text-[8px] h-5 bg-primary/20 text-primary border-0">Optional</Badge>
            {w.flex_day_type && (
              <Badge variant="secondary" className="text-[8px] h-5 capitalize">
                {w.flex_day_type}
              </Badge>
            )}
            <Button
              size="sm"
              className="h-7 text-[10px] px-2 mt-1 w-full"
              onClick={e => {
                e.stopPropagation();
                onConfirmFlex();
              }}
            >
              Add to schedule
            </Button>
          </div>
        )}
        {isFlex && row.is_confirmed && !completed && (
          <Badge variant="outline" className="text-[8px] mt-1 border-primary/40 text-primary">
            Flex
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (DraggableWrap && !unconfirmedFlex && !completed) {
    return (
      <DraggableWrap row={row} disabled={false}>
        {inner}
      </DraggableWrap>
    );
  }
  return inner;
}
