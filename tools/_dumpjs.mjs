// 从 exe 里解出主 JS 到文件（用于语法校验/对比）
// 用法: node tools/_dumpjs.mjs <exe> <out.mjs>
import fs from "node:fs";
import zlib from "node:zlib";
const [exe, out] = process.argv.slice(2);
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
  d.on("data", (x) => c.push(x)); d.on("end", () => res(Buffer.concat(c))); d.on("error", rej);
  d.end(buf.subarray(start, end));
});
fs.writeFileSync(out, js);
console.log("dumped", main.key, js.length, "bytes ->", out);
