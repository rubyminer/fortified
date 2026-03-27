import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, "..", "dist", "public", "config-env.js");

const payload = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "",
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? "",
  VITE_VAPID_PUBLIC_KEY: process.env.VITE_VAPID_PUBLIC_KEY ?? "",
};

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, `window.__FORTIFY_ENV__=${JSON.stringify(payload)};\n`, "utf8");
