// 统计词库每条在新/旧 exe 内嵌 JS 里的实际替换次数（与 patch-exe 逻辑一致）
// 用法: node tools/_keycounts.mjs <exe> <dict.json> <out.json>
import fs from "node:fs";
import zlib from "node:zlib";

const [exe, dictPath, outJson] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));
const ctxPath = dictPath.replace(/\.json$/, ".context.json");
const C = fs.existsSync(ctxPath) ? JSON.parse(fs.readFileSync(ctxPath, "utf8")) : {};
const buf = fs.readFileSync(exe);
const isPathByte = (b) => (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) || b === 0x2f || b === 0x2e || b === 0x2d || b === 0x5f;
const keys = [];
for (let i = 0; i < buf.length;) {
  if (buf[i] !== 0x2f) { i++; continue; }
  let j = i; while (j < buf.length && isPathByte(buf[j])) j++;
  if (j > i + 3) { const s = buf.toString("latin1", i, j); if (/\.(js|css|html|json)$/.test(s)) keys.push({ off: i, key: s }); }
  i = j > i ? j : i + 1;
}
const main = keys.filter((k) => /^\/assets\/index-.*\.js$/.test(k.key)).sort((a, b) => a.off - b.off)[0];
const start = main.off + main.key.length;
const after = keys.filter((k) => k.off > start).map((k) => k.off).sort((a, b) => a - b);
const end = after.length ? after[0] : buf.length;
const js = await new Promise((res, rej) => {
  const d = zlib.createBrotliDecompress(); const c = [];
  d.on("data", (x) => c.push(x)); d.on("end", () => res(Buffer.concat(c).toString("utf8"))); d.on("error", rej);
  d.end(buf.subarray(start, end));
});

const countOcc = (s, sub) => { let n = 0, i = 0; for (;;) { const p = s.indexOf(sub, i); if (p < 0) break; n++; i = p + sub.length; } return n; };

const exact = {}, literalAbsent = [];
for (const en of Object.keys(D)) {
  let n = countOcc(js, '"' + en + '"') + countOcc(js, "'" + en + "'");
  exact[en] = n;
}

// 前缀匹配（emoji 前缀等），与 patch-exe 规则 2 相同
const props = "children|label|placeholder|title|helperText|subtitle|heading|aria-label|alt|tooltip|description|text|buttonText|emptyText";
const re = new RegExp("(?:" + props + ")\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"", "g");
const prefix = {};
let m;
while ((m = re.exec(js)) !== null) {
  const raw = m[1];
  for (const en of Object.keys(D)) {
    if (raw.length > en.length && raw.endsWith(en)) {
      const pre = raw.slice(0, raw.length - en.length);
      if (pre === "" || /[\s\W]$/.test(pre)) { prefix[en] = (prefix[en] || 0) + 1; break; }
    }
  }
}
const ctx = {};
for (const from of Object.keys(C)) ctx[from] = countOcc(js, from);
const ctxAbsent = Object.keys(C).filter((k) => ctx[k] === 0);

const zero = Object.keys(D).filter((k) => !exact[k] && !prefix[k]);
fs.writeFileSync(outJson, JSON.stringify({ jsLen: js.length, exact, prefix, ctx, ctxAbsent, zero }, null, 2));
console.log("js len:", js.length, " dict:", Object.keys(D).length, " zero-hit:", zero.length, " ctx absent:", ctxAbsent.length);
