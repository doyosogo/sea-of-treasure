import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  verifyRefreshToken
} from "../utils/tokens.js";

const prisma = new PrismaClient();
const PASSWORD_SALT_ROUNDS = 12;

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});

const tokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export async function register(request, response, next) {
  try {
    const input = registerSchema.parse(request.body);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    });

    if (existingUser) {
      return response.status(409).json({ error: "Email or username is already registered." });
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash
      },
      select: publicUserSelect()
    });
    const tokens = await issueTokens(user.id);

    return response.status(201).json({ user, ...tokens });
  } catch (error) {
    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    const input = loginSchema.parse(request.body);
    const userWithPassword = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!userWithPassword) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(input.password, userWithPassword.passwordHash);

    if (!validPassword) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userWithPassword.id },
      select: publicUserSelect()
    });
    const tokens = await issueTokens(user.id);

    return response.json({ user, ...tokens });
  } catch (error) {
    return next(error);
  }
}

export async function logout(request, response, next) {
  try {
    const input = tokenSchema.parse(request.body);

    await prisma.refreshToken.deleteMany({
      where: {
        tokenHash: hashToken(input.refreshToken)
      }
    });

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function refresh(request, response, next) {
  try {
    const input = tokenSchema.parse(request.body);
    const payload = verifyRefreshToken(input.refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashToken(input.refreshToken)
      },
      include: {
        user: {
          select: publicUserSelect()
        }
      }
    });

    if (!storedToken || storedToken.userId !== payload.sub || storedToken.expiresAt <= new Date()) {
      return response.status(401).json({ error: "Invalid refresh token." });
    }

    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    const tokens = await issueTokens(storedToken.userId);

    return response.json({ user: storedToken.user, ...tokens });
  } catch (error) {
    return next(error);
  }
}

function publicUserSelect() {
  return {
    id: true,
    email: true,
    username: true,
    createdAt: true,
    updatedAt: true
  };
}

async function issueTokens(userId) {
  const accessToken = createAccessToken({ sub: userId });
  const refreshToken = createRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: getRefreshTokenExpiry()
    }
  });

  return {
    accessToken,
    refreshToken
  };
}
