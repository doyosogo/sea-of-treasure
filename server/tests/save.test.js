import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createTestHarness, createOversizedJsonPayload } from "./helpers.js";

let harness;

after(async () => {
  if (harness) {
    await harness.close();
  }
});

test("save requests require authentication", async () => {
  harness = await createTestHarness();

  const { response, body } = await harness.jsonRequest("/api/save");

  assert.equal(response.status, 401);
  assert.equal(body.error, "Missing bearer token.");
});

test("save endpoint rejects oversized payloads", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const { response, body } = await harness.jsonRequest("/api/save", {
    method: "PUT",
    headers: {
      ...harness.createAuthHeader()
    },
    body: JSON.stringify(createOversizedJsonPayload())
  });

  assert.equal(response.status, 413);
  assert.equal(body.error, "Save payload is too large. Maximum size is 2MB.");
});

test("save endpoint rejects invalid schema", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const { response, body } = await harness.jsonRequest("/api/save", {
    method: "PUT",
    headers: {
      ...harness.createAuthHeader()
    },
    body: JSON.stringify({
      version: "1.0"
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "Validation failed.");
});

test("save endpoint accepts a valid upload", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const originalUpsert = harness.prisma.saveGame.upsert;
  harness.prisma.saveGame.upsert = async () => ({
    data: {
      playerLevel: 12,
      gold: 3456
    },
    version: "1.0",
    updatedAt: new Date("2026-06-29T00:00:00.000Z")
  });

  try {
    const { response, body } = await harness.jsonRequest("/api/save", {
      method: "PUT",
      headers: harness.createAuthHeader(),
      body: JSON.stringify({
        data: {
          playerLevel: 12,
          gold: 3456
        },
        version: "1.0"
      })
    });

    assert.equal(response.status, 200);
    assert.equal(body.save.version, "1.0");
    assert.equal(body.save.data.playerLevel, 12);
    assert.equal(body.save.data.gold, 3456);
  } finally {
    harness.prisma.saveGame.upsert = originalUpsert;
  }
});
