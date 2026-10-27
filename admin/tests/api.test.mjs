import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = (
  await readFile(new URL("../src/services/api.ts", import.meta.url), "utf8")
).replace("import.meta.env.VITE_API_URL", "undefined");
const js = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { api } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
});
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("staff login sends credentials through cookies and JSON", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:3001/auth/login");
    assert.equal(options.credentials, "include");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      email: "staff@example.com",
      password: "secret",
    });
    return response({ user: { role: "ADMIN" } });
  };
  assert.equal(
    (await api.login("staff@example.com", "secret")).user.role,
    "ADMIN",
  );
});
test("protected requests refresh once after an expired session", async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return response(
      url.endsWith("/refresh") ? {} : { name: "Staff" },
      calls.length === 1 ? 401 : 200,
    );
  };
  assert.equal((await api.me()).name, "Staff");
  assert.deepEqual(
    calls.map((u) => new URL(u).pathname),
    ["/users/me", "/auth/refresh", "/users/me"],
  );
});
test("failed refresh emits session expiry without retrying indefinitely", async () => {
  let expired = 0;
  globalThis.window = {
    dispatchEvent: (event) => {
      if (event.type === "session-expired") expired++;
    },
  };
  globalThis.fetch = async () => response({ message: "Unauthorized" }, 401);
  await assert.rejects(api.me(), /Session expired/);
  assert.equal(expired, 1);
});
test("API validation messages and encoded searches survive the boundary", async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).searchParams.get("q"), "a&b@example.com");
    return response({ message: ["Invalid filter", "Try again"] }, 400);
  };
  await assert.rejects(
    api.users(1, "a&b@example.com", ""),
    /Invalid filter; Try again/,
  );
});
test("dispute outcome preserves the selected order action", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), {
      status: "RESOLVED",
      resolution: "Buyer wins",
      orderAction: "REFUND_BUYER",
    });
    return response({});
  };
  await api.resolveDispute("case-id", "RESOLVED", "Buyer wins", "REFUND_BUYER");
});
