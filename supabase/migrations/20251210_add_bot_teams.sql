-- Allow bot/test teams by making owner_user_id nullable, and add bot metadata.
-- Bot teams are regular teams with owner_user_id null, is_bot = true, and optional bot_note.

alter table teams
  alter column owner_user_id drop not null;

alter table teams
  add column if not exists is_bot boolean not null default false;

alter table teams
  add column if not exists bot_note text;

comment on column teams.is_bot is 'Marks a team as a test/bot team created by commissioner tooling.';
comment on column teams.bot_note is 'Optional note describing how/when the bot team was created.';

-- RLS: existing policies that check owner_user_id = auth.uid() will naturally exclude bot teams
-- because owner_user_id is null. League-level queries should continue to see all teams.
