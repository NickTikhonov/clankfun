/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: false,
    staticPageGenerationTimeout: 180,
    webpack: (config) => {
      // Handle .map files
      config.module.rules.push({
        test: /\.map$/,
        loader: 'ignore-loader',
      });

      // Handle .d.ts files
      config.module.rules.push({
        test: /\.d\.ts$/,
        loader: 'ignore-loader',
      });

      return config;
    },
    logging: {
        fetches: {
          fullUrl: true,
        },
    },
    async rewrites() {
      return [
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://us.i.posthog.com/:path*",
        },
      ];
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true, 
};

export default config;
