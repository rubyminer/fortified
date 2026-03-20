import { Router, type IRouter } from "express";
import { createSupabaseAdmin } from "../supabase-admin.js";

const router: IRouter = Router();

/**
 * Store Web Push subscription for the authenticated user.
 * Body: PushSubscription JSON from the browser (`subscription.toJSON()`).
 */
router.post("/push/subscribe", async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const body = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    res.status(400).json({ error: "Invalid subscription body" });
    return;
  }

  try {
    const admin = createSupabaseAdmin();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    const { error } = await admin.from("push_subscriptions").upsert(
      {
        user_id: userData.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      { onConflict: "user_id,endpoint" },
    );

    if (error) {
      console.error("[push/subscribe]", error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[push/subscribe]", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
