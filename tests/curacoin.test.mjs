import test from "node:test";
import assert from "node:assert/strict";
import {
  addLog, coinsForCompletion, createDefaultData, getWallet, grantLoginCoins,
  LOGIN_REWARD_INTERVAL_MS, removeLogAndCoins, updateLogRoomsAndCoins,
} from "../src/lib/store.ts";

const activity = {
  id: "chore_1", title: "Lavare pavimento", icon: "pavimento",
  type: "ordinaria", room: "Tutta casa", frequency: 7, estimatedMinutes: 10,
  notes: "", description: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const withChore = () => ({ ...createDefaultData(), chores: [activity] });

test("Every completed chore earns 1 CuraCoin per distinct room (minimum 1)", () => {
  assert.equal(coinsForCompletion([]), 1);
  assert.equal(coinsForCompletion(["Cucina"]), 1);
  assert.equal(coinsForCompletion(["Cucina", "Bagno", "Camera"]), 3);
  assert.equal(coinsForCompletion(["Cucina", "Cucina"]), 1);
  const allRooms = withChore();
  const done = addLog(allRooms, activity.id, {
    completedAt: "2026-10-20T12:00:00.000Z",
    rooms: allRooms.rooms,
  });
  assert.equal(done.logs[0].curaCoins, allRooms.rooms.length);
  assert.equal(getWallet(done).balance, allRooms.rooms.length);
  assert.equal(addLog(done, activity.id, { completedAt: "2026-10-20T19:00:00.000Z", rooms: allRooms.rooms }), done);
  assert.equal(getWallet(done).balance, allRooms.rooms.length);
});

test("Room changes and log deletion reconcile CuraCoins without modifying legacy logs", () => {
  const initial = withChore();
  const done = addLog(initial, activity.id, { completedAt: "2026-10-20T12:00:00.000Z", rooms: ["Bagno", "Cucina", "Camera"] });
  assert.equal(getWallet(done).balance, 3);
  const changed = updateLogRoomsAndCoins(done, done.logs[0].id, ["Bagno"]);
  assert.equal(changed.logs[0].curaCoins, 1);
  assert.equal(getWallet(changed).balance, 1);
  assert.equal(getWallet(removeLogAndCoins(changed, changed.logs[0].id)).balance, 0);

  const oldLog = { id: "legacy", choreId: activity.id, completedAt: "2026-01-09T00:00:00Z",
    note: "", rooms: ["Bagno"], durationMinutes: 2 };
  const historic = { ...initial, logs: [oldLog] };
  const edited = updateLogRoomsAndCoins(historic, oldLog.id, ["Cucina", "Bagno"]);
  assert.equal(edited.logs[0].curaCoins, undefined);
  assert.equal(getWallet(edited).balance, 0);
  assert.equal(getWallet(removeLogAndCoins(edited, oldLog.id)).balance, 0);
});

test("30 CuraCoin login bonus requires a fresh Clerk session AND a full week", () => {
  const t0 = new Date("2026-10-01T10:00:00.000Z");
  const original = withChore();
  const first = grantLoginCoins(original, "user_a", "session_1", t0, t0);
  assert.equal(getWallet(first).balance, 30);
  assert.equal(grantLoginCoins(first, "user_a", "session_1", t0, new Date(t0.getTime() + LOGIN_REWARD_INTERVAL_MS)), first);
  const sessionBeforeWeek = new Date(t0.getTime() + 1000);
  assert.equal(grantLoginCoins(first, "user_a", "session_2", sessionBeforeWeek, sessionBeforeWeek), first);
  // Even after 7 days, a session started before the threshold isn't a new weekly login.
  assert.equal(grantLoginCoins(first, "user_a", "session_2", sessionBeforeWeek, new Date(t0.getTime() + LOGIN_REWARD_INTERVAL_MS + 1000)), first);
  const secondLoginTime = new Date(t0.getTime() + LOGIN_REWARD_INTERVAL_MS + 1000);
  const second = grantLoginCoins(first, "user_a", "session_3", secondLoginTime, secondLoginTime);
  assert.equal(getWallet(second).balance, 60);
  assert.equal(getWallet(second).loginRewards.user_a.sessionId, "session_3");
  assert.equal(grantLoginCoins(second, "user_a", "session_3", secondLoginTime, new Date(secondLoginTime.getTime() + LOGIN_REWARD_INTERVAL_MS)), second);
  assert.equal(grantLoginCoins(second, "user_a", "", secondLoginTime, secondLoginTime), second);
});

test("Weekly rewards are per account, while wallet and legacy history persist in AppData", () => {
  const day = new Date("2026-10-01T10:00:00.000Z");
  const original = withChore();
  const one = grantLoginCoins(original, "user_a", "s_a", day, day);
  const another = grantLoginCoins(one, "user_b", "s_b", day, day);
  assert.equal(getWallet(another).balance, 60);
  assert.equal(getWallet(another).loginRewards.user_b.sessionId, "s_b");
  const done = addLog(another, activity.id, { rooms: ["Cucina"], completedAt: "2026-10-20T12:00:00Z" });
  assert.equal(getWallet(done).balance, 61);
  const restored = JSON.parse(JSON.stringify(done));
  assert.equal(getWallet(restored).balance, 61);
  assert.deepEqual(getWallet(createDefaultData()).loginRewards, {});
});
