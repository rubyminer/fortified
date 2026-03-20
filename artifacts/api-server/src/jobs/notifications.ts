import cron from "node-cron";
import webpush from "web-push";
import { format, parseISO, subDays } from "date-fns";
import { toDate, toZonedTime } from "date-fns-tz";
import { createSupabaseAdmin } from "../supabase-admin.js";

type ProfileRow = {
  supplemental_timing: string | null;
  discipline: string;
  notify_day_before: boolean | null;
  notify_hour_before: boolean | null;
  notification_timezone: string | null;
  preferred_workout_time: string | null;
};

type WorkoutRow = {
  title: string;
  week_number: number;
  day_number: number;
  subtrack: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  scheduled_date: string;
  preferred_time: string | null;
  is_confirmed: boolean;
  completed: boolean;
  notification_day_before_sent: boolean;
  notification_hour_before_sent: boolean;
  profiles: ProfileRow | ProfileRow[] | null;
  workouts: WorkoutRow | WorkoutRow[] | null;
};

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function subtrackLabel(id: string): string {
  return id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function localNowParts(tz: string): { dateStr: string; minutesSinceMidnight: number } {
  const now = new Date();
  const z = toZonedTime(now, tz);
  return {
    dateStr: format(z, "yyyy-MM-dd"),
    minutesSinceMidnight: z.getHours() * 60 + z.getMinutes(),
  };
}

export async function runNotificationSweep(): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("scheduled_sessions")
    .select(
      `
      id,
      user_id,
      scheduled_date,
      preferred_time,
      is_confirmed,
      completed,
      notification_day_before_sent,
      notification_hour_before_sent,
      profiles (
        supplemental_timing,
        discipline,
        notify_day_before,
        notify_hour_before,
        notification_timezone,
        preferred_workout_time
      ),
      workouts ( title, week_number, day_number, subtrack )
    `,
    )
    .eq("is_confirmed", true)
    .eq("completed", false);

  if (error) {
    console.error("[notifications sweep]", error);
    return;
  }

  const rows = (data ?? []) as SessionRow[];

  for (const row of rows) {
    const profile = one(row.profiles);
    const workout = one(row.workouts);
    if (!profile || !workout) continue;

    const subs = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", row.user_id);
    if (!subs.data?.length) continue;

    const tz = profile.notification_timezone || "UTC";
    const { dateStr: localToday, minutesSinceMidnight } = localNowParts(tz);
    const sessionDay = row.scheduled_date;
    const dayBefore = format(subDays(parseISO(sessionDay), 1), "yyyy-MM-dd");

    const timing = profile.supplemental_timing ?? "different_days";
    const sport = profile.discipline;

    if (
      profile.notify_day_before !== false &&
      !row.notification_day_before_sent &&
      localToday === dayBefore &&
      minutesSinceMidnight >= 20 * 60
    ) {
      let body: string;
      if (timing === "same_day_before") {
        body = `Tomorrow: ${workout.title} before your ${sport} training. ~45 min.`;
      } else if (timing === "same_day_after") {
        body = `Tomorrow: ${workout.title} after your ${sport} training. ~45 min.`;
      } else {
        body = `Tomorrow is a strength day — ${workout.title}. ~45 min.`;
      }
      const payload = JSON.stringify({
        title: "Fortify — Tomorrow",
        body,
        url: "/feed",
      });
      for (const s of subs.data) {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
          );
        } catch (e) {
          console.warn("[webpush day-before]", e);
        }
      }
      await admin
        .from("scheduled_sessions")
        .update({ notification_day_before_sent: true })
        .eq("id", row.id);
      continue;
    }

    if (profile.notify_hour_before === false || row.notification_hour_before_sent) continue;

    const pref = (row.preferred_time || profile.preferred_workout_time || "07:00:00").slice(0, 8);
    const [hh, mm] = pref.split(":").map(Number);
    const sessionStartUtc = toDate(
      `${sessionDay}T${String(hh).padStart(2, "0")}:${String(mm ?? 0).padStart(2, "0")}:00`,
      { timeZone: tz },
    );
    const remindAt = new Date(sessionStartUtc.getTime() - 60 * 60 * 1000);
    const now = new Date();
    if (localToday !== sessionDay) continue;
    if (now < remindAt || now >= sessionStartUtc) continue;

    const track = subtrackLabel(workout.subtrack);
    const payload = JSON.stringify({
      title: `${workout.title} — Starting Soon`,
      body: `Week ${workout.week_number}, Day ${workout.day_number} of your ${track} track. Open Fortify to begin.`,
      url: "/feed",
    });
    for (const s of subs.data) {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
        );
      } catch (e) {
        console.warn("[webpush hour-before]", e);
      }
    }
    await admin.from("scheduled_sessions").update({ notification_hour_before_sent: true }).eq("id", row.id);
  }
}

export function startNotificationCron(): void {
  const pub = process.env["VAPID_PUBLIC_KEY"];
  const priv = process.env["VAPID_PRIVATE_KEY"];
  const subj = process.env["VAPID_SUBJECT"] ?? "mailto:team@fortify.app";
  if (!pub || !priv) {
    console.warn("[notifications] Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable push cron");
    return;
  }
  webpush.setVapidDetails(subj, pub, priv);

  cron.schedule("*/30 * * * *", () => {
    void runNotificationSweep().catch(err => console.error("[notifications sweep]", err));
  });
  console.log("[notifications] Cron scheduled every 30 minutes");
}
