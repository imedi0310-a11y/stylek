// Copies the MediaPipe Tasks Vision WebAssembly runtime into /public so the
// on-device try-on engines load it from this site instead of a third-party CDN.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const target = join(root, "public", "mediapipe", "wasm");
const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

if (!existsSync(source)) {
  console.warn("[copy-mediapipe-wasm] @mediapipe/tasks-vision is not installed; skipping.");
  process.exit(0);
}

mkdirSync(target, { recursive: true });
for (const file of files) {
  copyFileSync(join(source, file), join(target, file));
}
console.log(`[copy-mediapipe-wasm] copied ${files.length} files to public/mediapipe/wasm`);
