import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const MAX_SAVE_PAYLOAD_BYTES = 2 * 1024 * 1024;

const saveSchema = z.object({
  data: z.record(z.unknown()),
  version: z.string().trim().min(1).max(32).optional().default("1.0")
});

export async function getSave(request, response, next) {
  try {
    const save = await prisma.saveGame.findUnique({
      where: { userId: request.user.id },
      select: saveSelect()
    });

    if (!save) {
      return response.json({ save: null });
    }

    return response.json({ save });
  } catch (error) {
    return next(error);
  }
}

export async function putSave(request, response, next) {
  try {
    const payloadSize = Buffer.byteLength(JSON.stringify(request.body ?? {}), "utf8");

    if (payloadSize > MAX_SAVE_PAYLOAD_BYTES) {
      return response.status(413).json({
        error: "Save payload is too large. Maximum size is 2MB."
      });
    }

    const input = saveSchema.parse(request.body);
    const save = await prisma.saveGame.upsert({
      where: { userId: request.user.id },
      create: {
        userId: request.user.id,
        data: input.data,
        version: input.version
      },
      update: {
        data: input.data,
        version: input.version
      },
      select: saveSelect()
    });

    return response.json({ save });
  } catch (error) {
    return next(error);
  }
}

function saveSelect() {
  return {
    data: true,
    version: true,
    updatedAt: true
  };
}
