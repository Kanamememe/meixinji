const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
function section(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, start);
  return source.slice(a, b);
}
const elements = new Map(["chat-reply-status", "chat-reply-status-text", "chat-reply-status-elapsed", "chat-reply-status-action"].map(id => [id, { hidden: false, textContent: "", dataset: {}, addEventListener(type, callback) { this.click = callback; } }]));
let thread = "a", last = { role: "user", content: "Hello" }, draft = "", viewing = true, now = 1000;
const timers = new Set();
let timerId = 0, requests = 0, stops = 0, finishSend;
const sandbox = {
  document: { getElementById: id => elements.get(id) },
  window: { clearTimeout: id => timers.delete(id), setTimeout: () => { timers.add(++timerId); return timerId; } },
  Date: { now: () => now },
  getActiveMaskIdForInbox: () => "mask",
  readChatActiveThreadRef: () => ({ threadId: thread }),
  isUserViewingChatThread: () => viewing,
  chatLogLastBubbleMessageForActiveUiSurface: () => last,
  getChatComposerDraftCombinedForTokens: () => draft,
  getChatAssistAbortCommitStateForSlot: () => null,
  abortActiveChatAssistRound: () => { stops++; },
  sendChatFromInput: () => { requests++; return new Promise(resolve => { finishSend = resolve; }); }
};
vm.createContext(sandbox);
vm.runInContext(`const chatAssistRoundInflightByThread = new Map(); const chatAssistRoundStartedAtByThread = new Map(); let chatReplyStatusTimerId = 0; let chatReplyStatusClickPending = false;`, sandbox);
vm.runInContext(section("function chatAssistRoundSlotKey(", "/** @param {string} slotKey */"), sandbox);
vm.runInContext(section("function bumpChatAssistRoundInflight(", "function syncChatSendButtonForActiveThread()"), sandbox);
const root = elements.get("chat-reply-status"), label = elements.get("chat-reply-status-text"), action = elements.get("chat-reply-status-action");
const sync = () => sandbox.syncChatReplyStatusForActiveThread();
async function main() {
  sync();
  assert.equal(root.dataset.state, "idle");
  assert.equal(action.textContent, "让角色回复");
  assert.equal(action.hidden, false);
  draft = "More to say"; sync(); assert.equal(action.hidden, true); draft = "";
  sandbox.bumpChatAssistRoundInflight("mask\ta", 1);
  now += 31000; sync();
  assert.equal(root.dataset.state, "busy");
  assert(label.textContent.includes("等待"));
  assert(elements.get("chat-reply-status-elapsed").textContent.includes("31 秒"));
  assert.equal(action.textContent, "停止回复");
  last = { role: "assistant", restoring: true, content: "Hello back" }; sync();
  assert.equal(label.textContent, "角色正在回复…");
  thread = "b"; last = { role: "user", content: "Other conversation" }; sync();
  assert.equal(root.dataset.state, "idle"); assert.equal(timers.size, 0);
  thread = "a"; sync(); await action.click(); assert.equal(stops, 1);
  sandbox.bumpChatAssistRoundInflight("mask\ta", -1);
  last = { role: "assistant", content: "（未能回复）HTTP 404" }; sync();
  assert.equal(root.dataset.state, "error"); assert.equal(action.textContent, "重试回复");
  const first = action.click(); await action.click(); assert.equal(requests, 1); finishSend(); await first;
  last = { role: "assistant", content: "Hello!" }; sync();
  assert.equal(root.dataset.state, "done"); assert.equal(action.hidden, true);
  viewing = false; sync(); assert.equal(root.hidden, true); assert.equal(timers.size, 0);
  console.log("Reply status checks passed: draft, waiting, streaming, thread switch, stop, retry, duplicate click, completion, closed view.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
