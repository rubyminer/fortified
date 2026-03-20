-- Fortify — Realtime via Broadcast + DB triggers (recommended vs postgres_changes at scale).
--
-- Schema facts:
--   chat_messages: PK id (uuid). "Room" key is subtrack (text slug), not room_id.
--   sessions:      PK id (uuid). Owner is user_id (uuid → profiles).
--
-- Topics:
--   Chat:     chat:<subtrack>:messages   e.g. chat:sled_carry_strength:messages
--   Sessions: user:<user_id>:sessions   per-athlete stream (app does not subscribe yet; safe for future feed sync).
--
-- After this migration + client update, you can optionally remove tables from the postgres_changes publication:
--   alter publication supabase_realtime drop table chat_messages;
--   alter publication supabase_realtime drop table sessions;
-- (Only if nothing else relies on postgres_changes for those tables.)

-- ─── Chat: broadcast per subtrack slug ─────────────────────────────────────

create or replace function public.fortify_chat_messages_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
begin
  st := coalesce(NEW.subtrack, OLD.subtrack);
  if st is null or st = '' then
    return null;
  end if;

  perform realtime.broadcast_changes(
    'chat:' || st || ':messages',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

drop trigger if exists fortify_chat_messages_broadcast on public.chat_messages;
create trigger fortify_chat_messages_broadcast
  after insert or update or delete on public.chat_messages
  for each row
  execute function public.fortify_chat_messages_broadcast();

-- ─── Sessions: broadcast per athlete (user_id) ─────────────────────────────

create or replace function public.fortify_sessions_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := coalesce(NEW.user_id, OLD.user_id);
  if uid is null then
    return null;
  end if;

  perform realtime.broadcast_changes(
    'user:' || uid::text || ':sessions',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

drop trigger if exists fortify_sessions_broadcast on public.sessions;
create trigger fortify_sessions_broadcast
  after insert or update or delete on public.sessions
  for each row
  execute function public.fortify_sessions_broadcast();

-- ─── Private channel authorization (realtime.messages) ─────────────────────
-- Docs: https://supabase.com/docs/guides/realtime/authorization
-- Use realtime.topic() and realtime.messages.extension = 'broadcast'.

alter table if exists realtime.messages enable row level security;

-- Remove common permissive template if you added it while testing (optional).
drop policy if exists "Authenticated users can receive broadcasts" on realtime.messages;

drop policy if exists "fortify_realtime_chat_subtrack_select" on realtime.messages;
create policy "fortify_realtime_chat_subtrack_select"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'chat:%:messages'
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.subtrack = split_part((select realtime.topic()), ':', 2)
    )
  );

drop policy if exists "fortify_realtime_user_sessions_select" on realtime.messages;
create policy "fortify_realtime_user_sessions_select"
  on realtime.messages
  for select
  to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and (select realtime.topic()) like 'user:%:sessions'
    and split_part((select realtime.topic()), ':', 2) = (select auth.uid())::text
  );
