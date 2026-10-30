import test from "node:test";
import assert from "node:assert/strict";
import { countDue, isValidDate, localDayAndHour } from "../src/logic.mjs";

test("Timezone awareness across DST, calendar day and hourly reminder", () => {
  assert.deepEqual(localDayAndHour("Europe/Rome", new Date("2026-10-30T08:00:00Z")),
    { day:"2026-10-30", hour:9 });
  assert.deepEqual(localDayAndHour("Europe/Rome", new Date("2026-10-30T17:00:00Z")),
    { day:"2026-10-30", hour:18 });
  assert.deepEqual(localDayAndHour("Europe/Rome", new Date("2026-07-05T07:00:00Z")),
    { day:"2026-07-05", hour:9 });
});
test("Due reminders count today's and overdue chores, but not future or invalid", () => {
  assert.equal(countDue([
    { id:"a", dueDate:"2026-10-29" },
    { id:"b", dueDate:"2026-10-30" },
    { id:"c", dueDate:"2026-10-31" },
    { id:"d", dueDate:"2026-02-30" },
  ], "2026-10-30"), 2);
  assert.equal(countDue([], "2026-10-30"), 0);
});
test("Reject malformed dates", () => {
  for (const key of ["2026-02-30","2026-10-32","2026-13-01","2026-1-1","oops"]) {
    assert.equal(isValidDate(key), false, key);
  }
  assert.equal(isValidDate("2026-02-28"), true);
});
