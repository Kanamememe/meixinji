const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const requests = [];
const context = {
  window: {}, URL, AbortController, setTimeout, clearTimeout, console,
  fetch: async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      text: async () => JSON.stringify({ data: [{ id: "gemini-test" }] }),
      json: async () => ({ choices: [{ message: { content: "OK" } }] })
    };
  }
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../ai-api.js"), "utf8"), context);
const api = context.window.RP_AI;
const google = "https://generativelanguage.googleapis.com";
const expected = `${google}/v1beta/openai`;

async function main() {
  for (const suffix of ["", "/", "/v1", "/v1beta", "/v1beta/openai/", "/v1beta/openai/v1", "/v1beta/openai/models", "/v1beta/openai/chat/completions"]) {
    assert.equal(api.resolveOpenAiV1Base(google + suffix), expected);
    assert.equal(api.resolveOpenAiV1Base(api.resolveOpenAiV1Base(google + suffix)), expected);
  }
  for (const [input, output] of [
    ["", "https://api.openai.com/v1"],
    ["https://api.openai.com/v1/chat/completions", "https://api.openai.com/v1"],
    ["https://relay.example/v1", "https://relay.example/v1"],
    ["https://open.bigmodel.cn/api/paas/v4", "https://open.bigmodel.cn/api/paas/v4"],
    ["https://generativelanguage.googleapis.com.example/v1", "https://generativelanguage.googleapis.com.example/v1"]
  ]) assert.equal(api.resolveOpenAiV1Base(input), output);

  const cfg = { baseUrl: `${google}/v1`, apiKey: "test-placeholder", model: "gemini-test" };
  const models = await api.listModels(cfg);
  assert.equal(models[0], "gemini-test");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${expected}/models`);
  await api.chatCompletions({ messages: [{ role: "user", content: "Hi" }] }, { completionConfig: cfg });
  assert.equal(requests[1].url, `${expected}/chat/completions`);
  assert.equal(requests[1].options.headers.Authorization, "Bearer test-placeholder");
  assert.equal(JSON.parse(requests[1].options.body).model, "gemini-test");
  console.log("API URL regression checks passed; model listing and chat use the Gemini compatibility endpoint.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
