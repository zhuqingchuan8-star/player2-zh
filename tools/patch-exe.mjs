// Patch the embedded frontend bundle inside player2.exe with a zh-CN dictionary.
// Usage: node tools/patch-exe.mjs <src.exe> <dict.json> <out.exe>
import fs from "node:fs";
import zlib from "node:zlib";

const [src, dictPath, out] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));
const buf = fs.readFileSync(src);

const isPathByte = (b) =>
  (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) ||
  b === 0x2f || b === 0x2e || b === 0x2d || b === 0x5f;

function scanKeys() {
  const keys = [];
  for (let i = 0; i < buf.length; ) {
    if (buf[i] !== 0x2f) { i++; continue; }
    let j = i; while (j < buf.length && isPathByte(buf[j])) j++;
    if (j > i + 3) {
      const s = buf.toString("latin1", i, j);
      if (/\.(js|css|html|json|svg|png|ico|wasm|woff2?|ttf|txt|md)$/.test(s)) keys.push({ off: i, key: s });
    }
    i = j > i ? j : i + 1;
  }
  return keys;
}
const decompress = (start) => new Promise((res, rej) => {
  const d = zlib.createBrotliDecompress(); const chunks = [];
  d.on("data", (c) => chunks.push(c));
  d.on("end", () => res(Buffer.concat(chunks)));
  d.on("error", rej);
  d.end(buf.subarray(start, Math.min(buf.length, start + 40 * 1024 * 1024)));
});

const keys = scanKeys();
const main = keys.find((k) => /^\/assets\/index-.*\.js$/.test(k.key));
if (!main) throw new Error("main js asset not found");
const blobStart = main.off + main.key.length;
const after = keys.filter((k) => k.off > blobStart).map((k) => k.off).sort((a, b) => a - b);
const slotEnd = after.length ? after[0] : buf.length;
const slotLen = slotEnd - blobStart;

let js = (await decompress(blobStart)).toString("utf8");
const before = js.length;
let count = 0;

// 0) 上下文精确替换：仅改展示用出现位置，避开内部枚举/比较
const ctxPath = dictPath.replace(/\.json$/, ".context.json");
const C = fs.existsSync(ctxPath) ? JSON.parse(fs.readFileSync(ctxPath, "utf8")) : {};
let n0 = 0;
for (const [from, to] of Object.entries(C)) {
  const parts = js.split(from);
  if (parts.length > 1) { n0 += parts.length - 1; js = parts.join(to); }
}
console.log("context replacements:", n0);

// 1) raw literal replacement for every dictionary key
for (const [en, zh] of Object.entries(D)) {
  for (const q of ['"', "'"]) {
    const from = q + en + q, to = q + zh + q;
    const parts = js.split(from);
    if (parts.length > 1) { count += parts.length - 1; js = parts.join(to); }
  }
}
// 2) prefix-aware replacement for literals that carry emoji/prefix (e.g. "🏠 Home - ...")
const props = "children|label|placeholder|title|helperText|subtitle|heading|aria-label|alt|tooltip|description|text|buttonText|emptyText";
const re = new RegExp('(?:' + props + ')\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"', "g");
let m, n2 = 0;
while ((m = re.exec(js)) !== null) {
  const raw = m[1];
  let t = null;
  for (const [en, zh] of Object.entries(D)) {
    if (raw.length > en.length && raw.endsWith(en)) {
      const pre = raw.slice(0, raw.length - en.length);
      if (pre === "" || /[\s\W]$/.test(pre)) { t = pre + zh; break; }
    }
  }
  if (t === null) continue;
  console.log("  prefix-match:", JSON.stringify(raw), "->", JSON.stringify(t));
  const from = '"' + raw + '"', to = '"' + t + '"';
  const parts = js.split(from);
  if (parts.length > 1) { n2 += parts.length - 1; js = parts.join(to); }
}
console.log("replacements: exact", count, " prefix", n2, " source", before, "->", js.length);

let packed = null;
for (const q of [11, 10, 9, 8]) {
  const c = zlib.brotliCompressSync(Buffer.from(js, "utf8"), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: q } });
  console.log("  q" + q + " ->", c.length, "/ slot", slotLen, c.length <= slotLen ? "OK" : "TOO BIG");
  if (c.length <= slotLen) { packed = c; break; }
}
if (!packed) throw new Error("does not fit");
const dst = Buffer.from(buf);
packed.copy(dst, blobStart);
dst.fill(0, blobStart + packed.length, slotEnd);
fs.writeFileSync(out, dst);
const back = await new Promise((res, rej) => {
  const d = zlib.createBrotliDecompress(); const chunks = [];
  d.on("data", (c) => chunks.push(c)); d.on("end", () => res(Buffer.concat(chunks))); d.on("error", rej);
  d.end(dst.subarray(blobStart, slotEnd));
});
console.log("wrote", out, " self-check:", back.toString("utf8") === js);