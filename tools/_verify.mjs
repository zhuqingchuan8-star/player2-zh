// 汉化结果断言检查：直接从汉化 exe 解出主 JS，检查应翻译项已消失、内部标识未被破坏
// 用法: node tools/_verify.mjs <exe> <cases.json>
import fs from "node:fs";
import zlib from "node:zlib";
const [exe, casesPath] = process.argv.slice(2);
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
const count = (sub) => { let n = 0, i = 0; for (;;) { const p = js.indexOf(sub, i); if (p < 0) break; n++; i = p + sub.length; } return n; };

const cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));
let fail = 0;
for (const grp of ["mustBeGone", "mustStillExist"]) {
  console.log(`--- ${grp} ---`);
  for (const s of cases[grp]) {
    const n = count(s);
    const ok = grp === "mustBeGone" ? n === 0 : n > 0;
    if (!ok) fail++;
    console.log(`  ${ok ? "OK  " : "FAIL"} [${n}] ${JSON.stringify(s)}`);
  }
}
console.log(fail ? `断言失败 ${fail} 条` : "全部断言通过");
process.exit(fail ? 1 : 0);
