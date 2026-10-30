import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `pnpm preview` serves the production build with the same security headers as vercel.json.
const vercel = JSON.parse(
  readFileSync(new URL("./vercel.json", import.meta.url), "utf8"),
) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
const securityHeaders = Object.fromEntries(
  vercel.headers
    .find((rule) => rule.source === "/(.*)")!
    .headers.filter((header) => header.key !== "Strict-Transport-Security")
    .map((header) => [header.key, header.value]),
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ["**/docs/**", "**/test-results/**", "**/playwright-report/**"],
    },
  },
  preview: { headers: securityHeaders },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
