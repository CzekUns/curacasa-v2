import { classifyChoreLevel, presetIdentity, updatedVacuumPresetTitle, type ChoreLevel } from "./chore-levels.ts";
import { normalizeRoomDetails, type RoomDetails } from "./rooms.ts";
import { getRoomRule, type ChoreRoomRule } from "./chore-rooms.ts";

export type ChoreType = "ordinaria" | "straordinaria";

export type Chore = {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChoreType;
  /** Cleaning depth, separate from routine/extraordinary frequency. */
  level?: ChoreLevel;
  room: string;
  /** Preset-assigned location scope; defaults to legacy room for old saved chores. */
  roomRule?: ChoreRoomRule;
  frequency: number;
  estimatedMinutes: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  /** Stable identity for a Store preset, even when the user edits its title. */
  presetKey?: string;
};

export type ChoreLog = {
  id: string;
  choreId: string;
  completedAt: string;
  durationMinutes: number;
  durationSeconds?: number;
  note: string;
  rooms: string[];
  /** Awarded at creation; old imported logs have no coin entry. */
  curaCoins?: number;
};

export type AppData = {
  rooms: string[];
  /** Optional for backwards compatibility with existing saves and backups. */
  roomDetails?: RoomDetails;
  chores: Chore[];
  logs: ChoreLog[];
  /** Persistent local CuraCoin ledger. Missing in legacy backups. */
  wallet?: CuraWallet;
};

export type LoginReward = {
  sessionId: string;
  awardedAt: string;
};

export type CuraWallet = {
  balance: number;
  lifetimeEarned: number;
  /** One reward clock per Clerk user; authentication is still required. */
  loginRewards: Record<string, LoginReward>;
};

export const LOGIN_REWARD_COINS = 30;
export const LOGIN_REWARD_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function emptyWallet(): CuraWallet {
  return { balance: 0, lifetimeEarned: 0, loginRewards: {} };
}

export function getWallet(data: AppData): CuraWallet {
  const saved = data.wallet;
  if (!saved) return emptyWallet();
  return {
    balance: Number.isFinite(saved.balance) ? Math.max(0, Math.trunc(saved.balance)) : 0,
    lifetimeEarned: Number.isFinite(saved.lifetimeEarned) ? Math.max(0, Math.trunc(saved.lifetimeEarned)) : 0,
    loginRewards: saved.loginRewards && typeof saved.loginRewards === "object"
      ? saved.loginRewards : {},
  };
}

/** The number of distinct rooms recorded; a location-free completion earns 1. */
export function coinsForCompletion(rooms: readonly string[]): number {
  return Math.max(1, new Set(rooms.filter((room) => typeof room === "string" && room.trim())).size);
}

/**
 * One-time bonus upon a real Clerk login, then only on a DIFFERENT session
 * created at least 7 full days after the preceding bonus.
 * Not awarded in demo mode or on page refresh/session restoration.
 */
export function grantLoginCoins(
  data: AppData,
  userId: string,
  sessionId: string,
  sessionStartedAt: string | Date,
  awardedAt: Date = new Date(),
): AppData {
  const started = new Date(sessionStartedAt).getTime();
  const current = awardedAt.getTime();
  if (!userId || !sessionId || !Number.isFinite(started) || !Number.isFinite(current)
    || started > current + 60_000) return data;

  const wallet = getWallet(data);
  const previous = wallet.loginRewards[userId];
  if (previous) {
    const last = new Date(previous.awardedAt).getTime();
    if (!Number.isFinite(last) || current - last < LOGIN_REWARD_INTERVAL_MS
      || sessionId === previous.sessionId
      || started < last + LOGIN_REWARD_INTERVAL_MS) return data;
  }

  return {
    ...data,
    wallet: {
      ...wallet,
      balance: wallet.balance + LOGIN_REWARD_COINS,
      lifetimeEarned: wallet.lifetimeEarned + LOGIN_REWARD_COINS,
      loginRewards: {
        ...wallet.loginRewards,
        [userId]: { sessionId, awardedAt: awardedAt.toISOString() },
      },
    },
  };
}

/** Adjust a new log's reward if its room list changes; historic logs remain at zero. */
export function updateLogRoomsAndCoins(data: AppData, logId: string, rooms: string[]): AppData {
  const log = data.logs.find((entry) => entry.id === logId);
  if (!log) return data;
  const wasRewarded = typeof log.curaCoins === "number";
  const nextCoins = wasRewarded ? coinsForCompletion(rooms) : undefined;
  const delta = (nextCoins ?? 0) - (log.curaCoins ?? 0);
  const wallet = getWallet(data);
  return {
    ...data,
    logs: data.logs.map((entry) => entry.id === logId ? { ...entry, rooms, ...(wasRewarded ? { curaCoins: nextCoins } : {}) } : entry),
    ...(delta !== 0 ? { wallet: {
      ...wallet,
      balance: Math.max(0, wallet.balance + delta),
      lifetimeEarned: Math.max(0, wallet.lifetimeEarned + delta),
    } } : {}),
  };
}

/** Removing a rewarded log reverses its earned coins; old logs are untouched. */
export function removeLogAndCoins(data: AppData, logId: string): AppData {
  const log = data.logs.find((entry) => entry.id === logId);
  if (!log) return data;
  const reversal = log.curaCoins ?? 0;
  const wallet = getWallet(data);
  return {
    ...data,
    logs: data.logs.filter((entry) => entry.id !== logId),
    ...(reversal ? { wallet: {
      ...wallet,
      balance: Math.max(0, wallet.balance - reversal),
      lifetimeEarned: Math.max(0, wallet.lifetimeEarned - reversal),
    } } : {}),
  };
}

const STORE_KEY = "curacasa_v2_data";

const now = () => new Date().toISOString();

const LEGACY_ICON_MAP: Record<string, string> = {
  bath: "bagno",
  bed: "letto",
  home: "casa",
  kitchen: "cucina",
  laundry: "lavatrice",
  living: "soggiorno",
  plant: "piante",
  trash: "pattumiera",
  vacuum: "aspirapolvere",
  window: "vetri",
};

export function dayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function monthKey(value: Date = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function daysAgo(value?: string | null) {
  if (!value) return null;
  const start = new Date(dayKey(value)).getTime();
  const today = new Date(dayKey(new Date())).getTime();
  return Math.round((today - start) / 86400000);
}

export function relativeDays(days: number | null) {
  if (days === null) return "mai fatta";
  if (days === 0) return "oggi";
  if (days === 1) return "ieri";
  if (days < 0) return `tra ${Math.abs(days)} giorni`;
  return `${days} giorni fa`;
}

function id(prefix: string) {
  return `${prefix}_${crypto.getRandomValues(new Uint32Array(3)).join("")}`;
}

export const DEFAULT_ROOMS = ["Cucina", "Bagno", "Camera", "Salone", "Balcone"];

const DEFAULT_CHORES: Omit<Chore, "id" | "createdAt" | "updatedAt">[] = [];

export function createDefaultData(): AppData {
  const stamp = now();
  return {
    rooms: DEFAULT_ROOMS,
    roomDetails: normalizeRoomDetails(DEFAULT_ROOMS),
    chores: DEFAULT_CHORES.map((chore) => ({
      ...chore,
      id: id("chore"),
      createdAt: stamp,
      updatedAt: stamp,
    })),
    logs: [],
    wallet: emptyWallet(),
  };
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const data = createDefaultData();
    saveData(data);
    return data;
  }
  try {
    const parsed = JSON.parse(raw) as AppData;
    const rooms = Array.isArray(parsed.rooms) ? parsed.rooms : DEFAULT_ROOMS;
    const chores = Array.isArray(parsed.chores)
      ? parsed.chores.map((chore) => {
          const icon = LEGACY_ICON_MAP[chore.icon] || chore.icon;
          const title = updatedVacuumPresetTitle({ ...chore, icon });
          return { ...chore, title, icon, roomRule: getRoomRule(chore), level: classifyChoreLevel({ ...chore, title, icon }) };
        })
      : [];
    const logs = Array.isArray(parsed.logs) ? parsed.logs : [];
    return {
      rooms,
      roomDetails: normalizeRoomDetails(rooms, parsed.roomDetails),
      chores,
      logs,
      wallet: getWallet(parsed),
    };
  } catch {
    const data = createDefaultData();
    saveData(data);
    return data;
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("curacasa:data-changed"));
  }
}

export function lastLog(chore: Chore, logs: ChoreLog[]) {
  return logs
    .filter((log) => log.choreId === chore.id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
}

/** Civil-day distance, immune to daylight-saving changes. */
export function civilDayNumber(key: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return Number.NaN;
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) {
    return Number.NaN;
  }
  return Math.floor(ms / 86_400_000);
}

export type DueStatus = "normal" | "soon" | "warning" | "overdue";

export function dueFor(chore: Chore, logs: ChoreLog[], today: Date = new Date()):
  { status: DueStatus; daysUntil: number | null; dueDate: string | null } {
  const frequency = Number(chore.frequency);
  if (!Number.isInteger(frequency) || frequency <= 0) {
    return { status: "normal", daysUntil: null, dueDate: null };
  }
  const latest = lastLog(chore, logs);
  // Previously, never-completed chores were *always* normal.
  // Use the creation date as the first-cycle anchor.
  const anchor = latest?.completedAt ?? chore.createdAt;
  if (!anchor || Number.isNaN(new Date(anchor).getTime())) {
    return { status: "normal", daysUntil: null, dueDate: null };
  }
  const anchorDay = civilDayNumber(dayKey(anchor));
  const todayDay = civilDayNumber(dayKey(today));
  const dueDay = anchorDay + frequency;
  const daysUntil = dueDay - todayDay;
  const dueDate = new Date(dueDay * 86_400_000).toISOString().slice(0, 10);
  if (daysUntil < 0) return { status: "overdue", daysUntil, dueDate };
  if (daysUntil === 0) return { status: "warning", daysUntil, dueDate };
  if (daysUntil <= Math.max(1, Math.ceil(frequency * .3))) {
    return { status: "soon", daysUntil, dueDate };
  }
  return { status: "normal", daysUntil, dueDate };
}

export function statusFor(chore: Chore, logs: ChoreLog[]): DueStatus {
  return dueFor(chore, logs).status;
}

/** Signature shared by Store activities and older imports with no presetKey. */
export function presetSignature(chore: Pick<Chore, "title" | "icon">): string {
  const normalize = (value: string) =>
    value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("it-IT");
  return `${normalize(chore.title)}::${normalize(chore.icon)}`;
}

export type PresetChore = Omit<Chore, "id" | "createdAt" | "updatedAt" | "notes"> & {
  notes?: string;
};

/**
 * Idempotent import: skips presets already in personal chores (including
 * older imported chores). Does not delete or mutate existing chores/logs.
 */
export function importPresets(data: AppData, presets: PresetChore[]): { data: AppData; added: number } {
  const existing = new Set(
    data.chores.flatMap((chore) => [chore.presetKey, presetSignature(chore), presetIdentity(chore)].filter((key): key is string => !!key)),
  );
  const stamp = now();
  const additions: Chore[] = [];
  for (const preset of presets) {
    const key = presetIdentity(preset);
    if (existing.has(key)) continue;
    existing.add(key);
    additions.push({
      ...preset,
      id: id("chore"),
      presetKey: key,
      level: classifyChoreLevel(preset),
      roomRule: getRoomRule(preset),
      notes: preset.notes || "",
      createdAt: stamp,
      updatedAt: stamp,
    });
  }
  return { data: additions.length ? { ...data, chores: [...data.chores, ...additions] } : data, added: additions.length };
}

export function hasCompletedOnDay(data: AppData, choreId: string, date: string | Date): boolean {
  const dateKey = dayKey(date);
  return data.logs.some((log) => log.choreId === choreId && dayKey(log.completedAt) === dateKey);
}

export function hasCompletedToday(data: AppData, choreId: string): boolean {
  return hasCompletedOnDay(data, choreId, new Date());
}

export function addLog(data: AppData, choreId: string, payload?: Partial<ChoreLog>): AppData {
  const completedAt = payload?.completedAt || now();
  // One registration per chore and local calendar day, including via Calendar.
  if (!data.chores.some((chore) => chore.id === choreId) ||
      hasCompletedOnDay(data, choreId, completedAt)) {
    return data;
  }
  const log: ChoreLog = {
    id: id("log"),
    choreId,
    completedAt,
    durationMinutes: Number(payload?.durationMinutes || 0),
    durationSeconds: Number(payload?.durationSeconds || 0),
    note: payload?.note || "",
    rooms: payload?.rooms || [],
    curaCoins: coinsForCompletion(payload?.rooms || []),
  };
  const wallet = getWallet(data);
  return {
    ...data,
    logs: [log, ...data.logs],
    wallet: {
      ...wallet,
      balance: wallet.balance + log.curaCoins!,
      lifetimeEarned: wallet.lifetimeEarned + log.curaCoins!,
    },
  };
}

export function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
