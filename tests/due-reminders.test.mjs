import test from "node:test";
import assert from "node:assert/strict";
import { dueFor, civilDayNumber, statusFor } from "../src/lib/store.ts";

const chore = (createdAt, frequency=7) => ({
  id:"a",title:"Pulire bagno",icon:"bagno",description:"",type:"ordinaria",
  room:"Bagno",frequency,createdAt,updatedAt:createdAt,estimatedMinutes:15,notes:""
});
const log = (completedAt) => ({id:"l",choreId:"a",completedAt,durationMinutes:10,note:"",rooms:[]});
const at = d => new Date(d+"T12:00:00");
test("never done: first due day is creation + frequency, not forever normal",()=>{
  assert.equal(dueFor(chore("2026-10-01T10:00:00",7),[],at("2026-10-05")).status,"soon");
  assert.deepEqual(dueFor(chore("2026-10-01T10:00:00",7),[],at("2026-10-08")),
    {status:"warning",daysUntil:0,dueDate:"2026-10-08"});
  assert.equal(dueFor(chore("2026-10-01T10:00:00",7),[],at("2026-10-09")).status,"overdue");
});
test("completion resets countdown from last completion",()=>{
 const logs=[log("2026-10-03T12:00:00"),log("2026-10-07T12:00:00")];
 assert.equal(dueFor(chore("2026-10-01T12:00:00"),logs,at("2026-10-14")).status,"warning");
 assert.equal(dueFor(chore("2026-10-01T12:00:00"),logs,at("2026-10-13")).daysUntil,1);
});
test("frequency zero disables reminders, invalid dates are safe",()=>{
 assert.equal(dueFor(chore("2026-10-01T00:00:00",0),[],at("2026-10-08")).daysUntil,null);
 assert.equal(dueFor(chore("invalid",7),[],at("2026-10-08")).status,"normal");
 assert.ok(Number.isNaN(civilDayNumber("2026-02-30")));
});
test("civil days work through daylight saving and across months",()=>{
 assert.equal(civilDayNumber("2026-03-29")-civilDayNumber("2026-03-28"),1);
 assert.equal(civilDayNumber("2026-11-01")-civilDayNumber("2026-10-31"),1);
 assert.equal(dueFor(chore("2026-10-27T10:00:00",3),[],at("2026-10-30")).status,"warning");
});
