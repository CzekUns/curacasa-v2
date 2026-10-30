-- Only notification delivery state is saved remotely. No notes, rooms,
-- chore names, email addresses, or the user's completion log.
CREATE TABLE IF NOT EXISTS reminder_devices (
  endpoint TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  subscription_json TEXT NOT NULL,
  chores_json TEXT NOT NULL,
  timezone TEXT NOT NULL,
  notify_hour INTEGER NOT NULL,
  last_notified_day TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminder_devices_owner ON reminder_devices(owner);
