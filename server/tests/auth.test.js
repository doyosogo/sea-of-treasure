import assert from "node:assert/strict";
import { after, test } from "node:test";
import bcrypt from "bcrypt";
import { createTestHarness } from "./helpers.js";

let harness;

after(async () => {
  if (harness) {
    await harness.close();
  }
});

test("register rejects invalid email", async () => {
  harness = await createTestHarness();
  const { response, body } = await harness.jsonRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "not-an-email",
      username: "captain",
      password: "password123"
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "Validation failed.");
});

test("register rejects short password", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const { response, body } = await harness.jsonRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "captain@example.com",
      username: "captain",
      password: "short"
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, "Validation failed.");
});

test("register rejects duplicate user", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const originalFindFirst = harness.prisma.user.findFirst;
  harness.prisma.user.findFirst = async () => ({
    id: "existing-user",
    email: "captain@example.com",
    username: "captain"
  });

  try {
    const { response, body } = await harness.jsonRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "captain@example.com",
        username: "captain",
        password: "password123"
      })
    });

    assert.equal(response.status, 409);
    assert.equal(body.error, "Email or username is already registered.");
  } finally {
    harness.prisma.user.findFirst = originalFindFirst;
  }
});

test("login rejects invalid password", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const originalFindFirst = harness.prisma.user.findFirst;
  const passwordHash = await bcrypt.hash("correct-password", 12);
  harness.prisma.user.findFirst = async () => ({
    id: "existing-user",
    email: "captain@example.com",
    username: "captain",
    passwordHash
  });

  try {
    const { response, body } = await harness.jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "captain@example.com",
        password: "wrong-password"
      })
    });

    assert.equal(response.status, 401);
    assert.equal(body.error, "Invalid email or password.");
  } finally {
    harness.prisma.user.findFirst = originalFindFirst;
  }
});

test("auth middleware rejects missing token", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const { response, body } = await harness.jsonRequest("/api/auth/me");

  assert.equal(response.status, 401);
  assert.equal(body.error, "Missing bearer token.");
});

test("auth middleware rejects invalid token", async () => {
  if (!harness) {
    harness = await createTestHarness();
  }

  const { response, body } = await harness.jsonRequest("/api/auth/me", {
    headers: {
      Authorization: "Bearer invalid-token"
    }
  });

  assert.equal(response.status, 401);
  assert.equal(body.error, "Invalid or expired token.");
});
