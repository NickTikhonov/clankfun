import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEYNAR_API_KEY: z.string(),
    ALCHEMY_API_KEY: z.string(),
    OX_API_KEY: z.string(),
    FEE_RECIPIENT: z.string(),
    DUNE_API_KEY: z.string(),
    DATABASE_URL: z.string(),
    CRON_SECRET: z.string(),
    REDIS_URL: z.string(),
    CLANKER_API_KEY: z.string(),
    CLANKER_API_KEY_2: z.string(),
    UPLOADTHING_TOKEN: z.string(),
    TELEGRAM_API_KEY: z.string(),
    PRIVY_APP_SECRET: z.string(),
    CACHE_DISABLED: z.boolean(),
    GRAPH_API_KEY: z.string(),
    COINGECKO_API_KEY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT: z.string(),
    NEXT_PUBLIC_ALCHEMY_ETH_ENDPOINT: z.string(),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
    NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT: process.env.NEXT_PUBLIC_ALCHEMY_BASE_ENDPOINT,
    NEXT_PUBLIC_ALCHEMY_ETH_ENDPOINT: process.env.NEXT_PUBLIC_ALCHEMY_ETH_ENDPOINT,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    OX_API_KEY: process.env.OX_API_KEY,
    FEE_RECIPIENT: process.env.FEE_RECIPIENT,
    DUNE_API_KEY: process.env.DUNE_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    CLANKER_API_KEY: process.env.CLANKER_API_KEY,
    CLANKER_API_KEY_2: process.env.CLANKER_API_KEY_2,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    TELEGRAM_API_KEY: process.env.TELEGRAM_API_KEY,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
    CACHE_DISABLED: process.env.CACHE_DISABLED == "true",
    GRAPH_API_KEY: process.env.GRAPH_API_KEY,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
