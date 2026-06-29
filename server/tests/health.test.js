import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createTestHarness } from "./helpers.js";

let harness;

after(async () => {
  if (harness) {
    await harness.close();
  }
});

test("health endpoint reports service status", async () => {
  harness = await createTestHarness();

  const { response, body } = await harness.jsonRequest("/api/health");

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "sea-of-treasure-api");
  assert.equal(body.environment, "test");
  assert.equal(typeof body.timestamp, "string");
});

test("database health endpoint responds when prisma query succeeds", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const originalQueryRaw = harness.prisma.$queryRaw;
  harness.prisma.$queryRaw = async () => [{ value: 1 }];

  try {
    const { response, body } = await harness.jsonRequest("/api/health/db");

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.database, "connected");
    assert.equal(body.service, "sea-of-treasure-api");
  } finally {
    harness.prisma.$queryRaw = originalQueryRaw;
  }
});
