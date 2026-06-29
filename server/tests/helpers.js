const TEST_ENV = {
  DATABASE_URL: "postgresql://sea_user:sea_password@localhost:5432/sea_of_treasure?schema=public",
  JWT_ACCESS_SECRET: "test-access-secret-for-api-tests",
  JWT_REFRESH_SECRET: "test-refresh-secret-for-api-tests",
  PORT: "3001",
  CLIENT_ORIGIN: "http://localhost:5173",
  NODE_ENV: "test"
};

export function setupTestEnv() {
  Object.assign(process.env, TEST_ENV);
}

export async function createTestHarness() {
  setupTestEnv();

  const [
    authController,
    healthController,
    saveController,
    authMiddleware,
    errorMiddlewareModule,
    { prisma },
    { createAccessToken }
  ] = await Promise.all([
    import("../src/controllers/auth.controller.js"),
    import("../src/controllers/health.controller.js"),
    import("../src/controllers/save.controller.js"),
    import("../src/middleware/auth.middleware.js"),
    import("../src/middleware/error.middleware.js"),
    import("../src/lib/prisma.js"),
    import("../src/utils/tokens.js")
  ]);

  async function call(handler, { body = {}, headers = {}, user = null, originalUrl = "/" } = {}) {
    const request = {
      body,
      headers: normalizeHeaders(headers),
      user,
      originalUrl,
      method: "POST"
    };
    const response = createMockResponse();
    const next = (error) => {
      if (error) {
        errorMiddlewareModule.errorMiddleware(error, request, response, () => {});
      }
    };

    await handler(request, response, next);

    return {
      request,
      response: {
        status: response.statusCode,
        headers: response.headers,
        async json() {
          return response.jsonBody;
        },
        async text() {
          return response.bodyText;
        }
      },
      body: response.jsonBody ?? parseJson(response.bodyText)
    };
  }

  async function jsonRequest(path, options = {}) {
    const method = options.method ?? "GET";
    const body = options.body ? parseJson(options.body) : {};
    const headers = normalizeHeaders(options.headers ?? {});

    if (path === "/api/health") {
      return call(healthController.getHealth, { originalUrl: path, headers, body });
    }

    if (path === "/api/health/db") {
      return call(healthController.getDatabaseHealth, { originalUrl: path, headers, body });
    }

    if (path === "/api/auth/register") {
      return call(authController.register, { originalUrl: path, headers, body });
    }

    if (path === "/api/auth/login") {
      return call(authController.login, { originalUrl: path, headers, body });
    }

    if (path === "/api/auth/logout") {
      return call(authController.logout, { originalUrl: path, headers, body });
    }

    if (path === "/api/auth/refresh") {
      return call(authController.refresh, { originalUrl: path, headers, body });
    }

    if (path === "/api/auth/me") {
      const request = {
        body,
        headers,
        originalUrl: path,
        method,
        user: null
      };
      const response = createMockResponse();
      const next = (error) => {
        if (error) {
          errorMiddlewareModule.errorMiddleware(error, request, response, () => {});
        }
      };

      await authMiddleware.requireAuth(request, response, next);

      if (response.jsonBody !== undefined || response.statusCode !== 200) {
        return {
          request,
          response: {
            status: response.statusCode,
            headers: response.headers,
            async json() {
              return response.jsonBody;
            },
            async text() {
              return response.bodyText;
            }
          },
          body: response.jsonBody ?? parseJson(response.bodyText)
        };
      }

      await authController.me(request, response, next);

      return {
        request,
        response: {
          status: response.statusCode,
          headers: response.headers,
          async json() {
            return response.jsonBody;
          },
          async text() {
            return response.bodyText;
          }
        },
        body: response.jsonBody ?? parseJson(response.bodyText)
      };
    }

    if (path === "/api/save" && method === "GET") {
      const request = {
        body,
        headers,
        originalUrl: path,
        method,
        user: null
      };
      const response = createMockResponse();
      const next = (error) => {
        if (error) {
          errorMiddlewareModule.errorMiddleware(error, request, response, () => {});
        }
      };

      await authMiddleware.requireAuth(request, response, next);
      if (response.jsonBody !== undefined || response.statusCode !== 200) {
        return {
          request,
          response: {
            status: response.statusCode,
            headers: response.headers,
            async json() {
              return response.jsonBody;
            },
            async text() {
              return response.bodyText;
            }
          },
          body: response.jsonBody ?? parseJson(response.bodyText)
        };
      }

      await saveController.getSave(request, response, next);

      return {
        request,
        response: {
          status: response.statusCode,
          headers: response.headers,
          async json() {
            return response.jsonBody;
          },
          async text() {
            return response.bodyText;
          }
        },
        body: response.jsonBody ?? parseJson(response.bodyText)
      };
    }

    if (path === "/api/save" && method === "PUT") {
      const request = {
        body,
        headers,
        originalUrl: path,
        method,
        user: null
      };
      const response = createMockResponse();
      const next = (error) => {
        if (error) {
          errorMiddlewareModule.errorMiddleware(error, request, response, () => {});
        }
      };

      await authMiddleware.requireAuth(request, response, next);
      if (response.jsonBody !== undefined || response.statusCode !== 200) {
        return {
          request,
          response: {
            status: response.statusCode,
            headers: response.headers,
            async json() {
              return response.jsonBody;
            },
            async text() {
              return response.bodyText;
            }
          },
          body: response.jsonBody ?? parseJson(response.bodyText)
        };
      }

      await saveController.putSave(request, response, next);

      return {
        request,
        response: {
          status: response.statusCode,
          headers: response.headers,
          async json() {
            return response.jsonBody;
          },
          async text() {
            return response.bodyText;
          }
        },
        body: response.jsonBody ?? parseJson(response.bodyText)
      };
    }

    throw new Error(`Unsupported test path: ${path}`);
  }

  function createAuthHeader(userId = "test-user-id") {
    return {
      Authorization: `Bearer ${createAccessToken({ sub: userId })}`
    };
  }

  return {
    authController,
    authMiddleware,
    healthController,
    saveController,
    prisma,
    createAuthHeader,
    jsonRequest,
    close: async () => {}
  };
}

export function createOversizedJsonPayload() {
  return {
    data: {
      blob: "x".repeat(2 * 1024 * 1024 + 32)
    }
  };
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    jsonBody: undefined,
    bodyText: "",
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonBody = payload;
      this.bodyText = JSON.stringify(payload);
      return this;
    },
    send(payload) {
      if (typeof payload === "string") {
        this.bodyText = payload;
        this.jsonBody = parseJson(payload);
      } else {
        this.jsonBody = payload;
        this.bodyText = JSON.stringify(payload);
      }
      return this;
    }
  };
}

function normalizeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

function parseJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
