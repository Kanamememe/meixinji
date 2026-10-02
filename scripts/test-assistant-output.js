const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const sandbox = {
  window: {}, CHAT_CHAR_FORUM_SHARE_TO_USER_ENABLED: false,
  stripCharLockPlainProtocolBlocksFromText: text => ({ text }),
  normalizeOfflineProseForDisplayJoined: text => text,
  parseRelationDmForwardFromAssistantJson: () => null,
  parseForumCommentFromAssistantJson: () => null,
  normalizeAssistantPlaceCallValue: () => "",
  normalizeAssistantEndCallValue: () => false,
  parseAssistantEndCallNote: () => "",
  parseAdoptUserImageAsAvatarFlag: () => false,
  parseAdoptUserImagePickFromAssistantJson: () => 0,
  normalizeJsonRecallsField: () => [],
  extractTheaterSnapsRawFromAssistantJson: () => [],
  parseNarrationFromAssistantJson: o => o.narration || "",
  parseCharImageCaptionFromAssistantJson: () => "",
  parseCharImageUrlFromAssistantJson: () => "",
  parseImageSubjectFromAssistantJson: () => "auto",
  findInlineImageProtocolStart: () => -1,
  isAssistantImageProtocolLine: () => false,
  parseAssistantSpeakAsFromJson: () => "",
  parseCharImageCaptionFromLooseAssistantText: () => "",
  parseCharImageUrlFromLooseAssistantText: () => "",
  inferStickerIntentFromLooseAssistantJsonText: () => ({}),
  inferEndCallFromLooseAssistantJsonText: () => false,
  extractRelationDmForwardFromRawSnippet: () => null
};
vm.createContext(sandbox);
const names = [
  "tryRepairAssistantLinesOnly", "buildChatLinesOnlyRepairMessages", "spreadOptionalMaxTokens", "isChatAssistAbortError", "readStrictImAssistantPayload", "isAssistantThinkingHeading", "stripAssistantThinkingBlocks", "sanitizeAssistantVisibleText",
  "assistantTopLevelFieldSource", "extractAssistantTopLevelString", "extractLooseAssistantLinesFromRaw",
  "isAssistantThinkingLeakLine", "assistantPlainTextLooksLikeThinkingLeak", "stripUtf8Bom",
  "normalizeAssistantModelJsonText", "extractJsonStringFieldLoose", "extractJsonNumberFieldLoose",
  "salvageAssistantDisplayReplyFromRaw", "coalesceAssistantDisplayReply", "stripOfflineMeetupTagFromAssistantReply",
  "splitImAssistantReplyLines", "imInlineNewlinesLookLikeSeparateBubbles", "splitOuterAssistantBubbleSegments",
  "normalizeImAssistantReplyJoined", "splitOfflineAssistantBubbleSegments", "normalizeAssistantNarrationText",
  "sliceFirstBalancedJsonObject", "pickAssistantMindPanelObject", "extractHeartVoiceDeepFromAssistantJson",
  "parseHvPanelFieldsFromJson", "normalizeJsonHeartVoiceField", "tryRecoverHeartVoicePayloadFromBrokenJson", "parseChatAssistantPayload",
  "parseOfflineAssistantPayload", "parseImAssistantPayload", "parseAssistantPayloadForDmSurface",
  "extractOfflineAssistantStreamPreview", "readChatCompletionChoiceText", "readChatCompletionSalvagedText",
  "patchImAssistantStreamRow", "imAssistantStreamLinesArrayLikelyOpen", "finalizeChatAssistRoundAfterUserAbort"
];
for (const name of names) {
  let start = source.indexOf(`function ${name}(`);
  if (source.slice(start - 6, start) === "async ") start -= 6;
  const end = source.indexOf("\n}", start) + 2;
  assert(start >= 0 && end > start, name);
  const code = source.slice(start, end).replaceAll("catch (_) {", "catch (_) { if (_ instanceof ReferenceError) throw _;");
  vm.runInContext(code, sandbox, { filename: name });
}
const s = sandbox;
const draft = "thinking\n\n这个头又开始胡思乱想了。\n\n手指在键盘上敲了下，语气得放轻松点。\n\n卡面细节：不着痕迹地偏爱。\n\n- 说话不要句号";
const surfaces = ["im", "offline"];
for (const raw of [draft, draft.replaceAll("\n\n", "|||"), "```thinking\n草稿\n```", "<think>草稿", '{"thinking":"只有草稿"}', '{"thinking":"未闭合草稿', '{"thinking":{"text":"私有草稿","lines":["示例台词"]}}']) {
  for (const surf of surfaces) {
    const parsed = s.parseAssistantPayloadForDmSurface(raw, surf, raw);
    assert.equal(parsed.reply, "", `${surf}: ${raw}`);
    assert.equal(s.coalesceAssistantDisplayReply(parsed.reply, raw, surf), "", `fallback: ${raw}`);
  }
  assert.equal(s.extractOfflineAssistantStreamPreview(raw), "", `preview: ${raw}`);
}
for (const raw of ['<think>草稿 {"lines":["伪台词"]}</think>{"lines":["我在"]}', '```thinking\n草稿\n```\n{"lines":["我在"]}', 'thinking\n草稿\nfinal\n{"lines":["我在"]}']) {
  assert.equal(s.parseChatAssistantPayload(raw).reply, "我在");
}
for (const raw of ["我在想你", "I was thinking about you", "他低头想了想，随后说：「我在。」", "这里就是我们的世界"]) {
  for (const surf of surfaces) assert.equal(s.parseAssistantPayloadForDmSurface(raw, surf).reply, surf === "im" ? "" : raw);
}
// Screenshot regression: renamed/bilingual headings and arbitrary unstructured prose.
for (const heading of ["思绪（thinking）：", "思緒 (thinking) :", "**思绪（thinking）：**", "思绪", "analysis"]) {
  const raw = heading + "\n\n她困了。\n\n得把她从胡思乱想里拽出来，语气松快点。";
  assert.equal(s.parseImAssistantPayload(raw).reply, "");
  assert.equal(s.coalesceAssistantDisplayReply(raw, raw, "im"), "");
  const encoded = JSON.stringify({ lines: [heading, "她困了。", "语气松快点。"] });
  assert.equal(s.parseImAssistantPayload(encoded).reply, "");
  assert.equal(s.coalesceAssistantDisplayReply("草稿不能绕过校验", encoded, "im"), "");
}
for (const raw of ["无任何标题的草稿", '{"text":"误用字段"}', '{"lines":["未完成"]', '{"thinking":{"lines":["嵌套示例"]}}']) {
  assert.equal(s.coalesceAssistantDisplayReply("已有预览", raw, "im"), "");
}
assert.equal(s.parseImAssistantPayload('{"lines":["我在，慢慢说"]}').reply, "我在，慢慢说");
const valid = JSON.stringify({
  thinking: { text: "草稿", lines: ["草稿里的示例"] },
  lines: ["我在", "慢慢说"],
  lineTranslations: ["I am here", "Take your time"],
  mind: { heartVoice: "心声照常保留", mood: "平静" }
});
const parsed = s.parseChatAssistantPayload(valid);
assert.equal(parsed.reply, "我在|||慢慢说");
assert.equal(parsed.heartVoice, "心声照常保留");
assert.equal(parsed.hvMood, "平静");
assert.equal(parsed.lineTranslationsJoined, "I am here|||Take your time");
const filtered = s.parseChatAssistantPayload(JSON.stringify({ lines: ["卡面细节：草稿", "我在"], lineTranslations: ["draft", "I am here"], voiceLines: [false, true], voiceSeconds: [0, 4] }));
assert.equal(filtered.reply, "我在");
assert.equal(filtered.lineTranslationsJoined, "I am here");
assert.equal(filtered.voiceLines[0], true);
assert.equal(filtered.voiceSeconds[0], 4);
assert.equal(s.parseChatAssistantPayload('{"lines":["thinking","中文草稿","更多草稿"]}').reply, "");
assert.equal(s.parseChatAssistantPayload('{"lines":["<think>草稿</think>我在"]}').reply, "我在");
assert.equal(s.parseChatAssistantPayload('{"thinking":"草稿", "lines":["我在"]').reply, "我在");
assert.equal(s.extractLooseAssistantLinesFromRaw('{"lines":[{"text":"不可猜测"}]}').length, 0);
assert.equal(s.extractLooseAssistantLinesFromRaw('{"lines":["\\u0074hinking","草稿"]}').length, 0);
assert.equal(s.extractLooseAssistantLinesFromRaw('{"lines":["\\u6211在"]}')[0], "我在");
// Every chunk boundary: nested examples and incomplete thinking never enter either preview.
let preview = "";
s.patchAssistantStreamPreviewRow = (mask, thread, patch) => { preview = patch.content; };
for (let i = 0; i <= valid.length; i++) {
  const chunk = valid.slice(0, i);
  s.patchImAssistantStreamRow("mask", "thread", chunk);
  assert(!/草稿|thinking|心声/.test(preview));
  assert(!/草稿|thinking|心声/.test(s.extractOfflineAssistantStreamPreview(chunk)));
}
assert.equal(preview, "我在|||慢慢说");
for (const data of [
  { choices: [{ message: { content: "", reasoning_content: "草稿" } }] },
  { choices: [{ message: { content: [{ type: "reasoning", text: "草稿" }] } }] },
  { candidates: [{ content: { parts: [{ text: "草稿", thought: true }] } }] }
]) assert.equal(s.readChatCompletionSalvagedText(data), "");
assert.equal(s.readChatCompletionChoiceText({ candidates: [{ content: { parts: [{ text: "草稿", thought: true }, { text: "我在" }] } }] }), "我在");
// Stopping a turn must not reintroduce a draft via the partial-response store.
let saved;
Object.assign(s, {
  chatAssistRoundSlotKey: () => "slot",
  getChatAssistAbortCommitStateForSlot: () => ({ roundMaskId: "mask", roundThreadId: "thread", reply: draft }),
  readChatLogForMaskThread: () => [], removeChatRestoringPlaceholders: () => {},
  clearAssistantRestoringFlagsInLog: () => {}, showToast: () => {},
  saveChatLogForMaskThread: (m, t, log) => { saved = log; },
  scheduleChatUiRefreshForRound: () => {}, scheduleChatProactiveTimer: () => {},
  clearChatAssistAbortCommitState: () => {}
});
s.finalizeChatAssistRoundAfterUserAbort("mask", "thread", "im", true);
assert.equal(saved.length, 0);
async function checkTransport() {
  const contextMessages = [{ role: "system", content: "原角色人设" }, { role: "user", content: "用户原话" }];
  let retryMessages;
  s.requestChatAssistantCompletion = async (ai, opts) => {
    retryMessages = opts.messages;
    return { choices: [{ message: { content: '{"lines":["我在"]}' } }] };
  };
  const repaired = await s.tryRepairAssistantLinesOnly({}, "思绪（thinking）：草稿", 1024, "im", undefined, contextMessages);
  assert.equal(repaired.parsed.reply, "我在");
  assert.equal(retryMessages[0], contextMessages[0]);
  assert.equal(retryMessages[1], contextMessages[1]);
  assert.equal(retryMessages.length, 3);
  assert(!retryMessages.some(m => m.content.includes("思绪（thinking）：草稿")));
  s.requestChatAssistantCompletion = async () => ({ choices: [{ message: { content: "又是纯文字草稿" } }] });
  assert.equal(await s.tryRepairAssistantLinesOnly({}, "草稿内容", 1024, "im", undefined, contextMessages), null);

  let streaming = false;
  const parts = [{ type: "text", thought: true, text: "草稿" }, { type: "text", text: "我在" }];
  const context = {
    window: {}, URL, AbortController, setTimeout, clearTimeout, TextDecoder,
    fetch: async () => streaming
      ? new Response(new ReadableStream({ start(controller) {
        const encoder = new TextEncoder();
        for (const delta of [{ reasoning_content: "草稿" }, { content: parts }]) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } }), { headers: { "Content-Type": "text/event-stream" } })
      : new Response(JSON.stringify({ choices: [{ message: { content: parts } }] }), { headers: { "Content-Type": "application/json" } })
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../ai-api.js"), "utf8"), context);
  const options = { completionConfig: { baseUrl: "https://test.invalid/v1", apiKey: "test-placeholder", model: "test" } };
  assert.equal((await context.window.RP_AI.chatCompletionsStream({ messages: [] }, options)).content, "我在");
  streaming = true;
  assert.equal((await context.window.RP_AI.chatCompletionsStream({ messages: [] }, options)).content, "我在");
  console.log("Assistant output checks passed: drafts, malformed JSON, streaming boundaries, visible dialogue, heart panel, translations, API thought fields and abort.");
}
checkTransport().catch(error => { console.error(error); process.exitCode = 1; });
