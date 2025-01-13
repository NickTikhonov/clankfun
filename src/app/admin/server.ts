"use server"

import { env } from "~/env"
import { db } from "~/lib/db";

export async function adminSetNSFW(secret: string, ca: string, nsfw: boolean) {
  if (secret !== env.CRON_SECRET) {
    throw new Error("Invalid secret");
  }

  const cleanCA = ca.trim().toLowerCase();

  const clanker = await db.clanker.findFirst({
    where: {
      contract_address: cleanCA,
    },
  })
  if (!clanker) {
    throw new Error("Clanker not found");
  }

  await db.clanker.update({
    where: {
      contract_address: cleanCA,
    },
    data: {
      nsfw,
    },
  });
}