// Extract embedded frontend assets (brotli) from Tauri v2 player2.exe.
// Usage: node tools/extract-assets.mjs "D:\\ruanjian\\player2\\player2.exe" frontend
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const exe = process.argv[2];
const outDir = process.argv[3] || "frontend";
const buf = fs.readFileSync(exe);

const isPathByte = (b) =>
  (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) ||
  b === 0x2f || b === 0x2e || b === 0x2d || b === 0x5f;

const keys = [];
for (let i = 0; i < buf.length; ) {
  if (buf[i] !== 0x2f) { i++; continue; }
  let j = i; while (j < buf.length && isPathByte(buf[j])) j++;
  if (j > i + 3) {
    const s = buf.toString("latin1", i, j);
    if (/\.(js|css|html|json|svg|png|ico|wasm|woff2?|ttf|txt|md)$/.test(s)) keys.push([i, s]);
  }
  i = j > i ? j : i + 1;
}

const skip = /node_modules|docs\.rs|swagger|example\.com|^\/\//;
const seen = new Set();
const assets = [];
for (const [off, k] of keys) {
  if (skip.test(k) || seen.has(k)) continue;
  seen.add(k);
  assets.push([off, k]);
}
console.log("asset key candidates:", assets.length);

function decompress(start) {
  return new Promise((res) => {
    const d = zlib.createBrotliDecompress();
    const chunks = [];
    let done = false;
    d.on("data", (c) => chunks.push(c));
    d.on("end", () => { if (!done) { done = true; res(Buffer.concat(chunks)); } });
    d.on("error", () => { if (!done) { done = true; res(null); } });
    d.end(buf.subarray(start, Math.min(buf.length, start + 40 * 1024 * 1024)));
  });
}

const results = [];
for (const [off, k] of assets) {
  const start = off + k.length;
  if (start + 4 >= buf.length) continue;
  const data = await decompress(start);
  if (!data) continue;
  const rel = k.replace(/^\//, "").replace(/[\\/:*?"<>|]/g, "_");
  const p = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  results.push({ key: k, blobOffset: start, size: data.length });
  console.log("OK  " + k + "  ->  " + data.length + " bytes");
}
fs.writeFileSync(path.join(outDir, "_manifest.json"), JSON.stringify(results, null, 2));
console.log("extracted:", results.length);

const main = results.find((r) => /index-.*\.js$/.test(r.key));
if (main) {
  const next = assets.filter((a) => a[0] > main.blobOffset).map((a) => a[0]).sort((a, b) => a - b)[0] ?? buf.length;
  console.log("main JS decompressed:", main.size, "blob@", main.blobOffset, "gap->next key:", next - main.blobOffset);
}