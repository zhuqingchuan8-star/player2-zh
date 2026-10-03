// 全量扫描 exe 内嵌前端里未翻译的界面字符串
// 用法: node tools/scan-all.mjs <dict.json> <exe> [out.txt]
import fs from "node:fs";
import zlib from "node:zlib";
const [dictPath, exe, outPath = "i18n/_scan.txt"] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));
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

// --- 分词 ---
const lits = [];
const prevNonSpace = (i) => { let j = i - 1; while (j >= 0 && /\s/.test(js[j])) j--; return j >= 0 ? js[j] : ""; };
for (let i = 0; i < js.length;) {
  const c = js[i], c2 = js[i + 1];
  if (c === "/" && c2 === "/") { const e = js.indexOf("\n", i); if (e < 0) break; i = e; continue; }
  if (c === "/" && c2 === "*") { const e = js.indexOf("*/", i + 2); i = e < 0 ? js.length : e + 2; continue; }
  if (c === "`") {
    let j = i + 1, depth = 0;
    while (j < js.length) {
      const d = js[j];
      if (d === "\\") { j += 2; continue; }
      if (d === "$" && js[j + 1] === "{") { depth++; j += 2; continue; }
      if (depth > 0 && d === "}") { depth--; j++; continue; }
      if (depth === 0 && d === "`") break;
      j++;
    }
    lits.push(js.slice(i + 1, j)); i = j + 1; continue;
  }
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < js.length) { const d = js[j]; if (d === "\\") { j += 2; continue; } if (d === c) break; j++; }
    lits.push(js.slice(i + 1, j)); i = j + 1; continue;
  }
  if (c === "/") {
    const p = prevNonSpace(i);
    if (p === "" || "(,=:[!&|?{};+-*%~^<>".includes(p)) {
      let j = i + 1, inClass = false;
      while (j < js.length) { const d = js[j]; if (d === "\\") { j += 2; continue; } if (d === "[") inClass = true; else if (d === "]") inClass = false; else if (d === "/" && !inClass) break; else if (d === "\n") break; j++; }
      i = j + 1; continue;
    }
  }
  i++;
}

const codeish = /=>|function\s*\(|\bvar\b|\bconst\b|\breturn\b|window\.|document\.|\bundefined\b|\bnull\b|process\.|\bthis\b|\\u[0-9a-f]{4}|\$\{|;\s|\{|\}|\[object|NaN|\.js\b|\.css\b|\.json\b/i;
const cssish = /\bpx\b|\brgba?\(|linear-gradient|@keyframes|@media|\.Mui|!important|translate\(|repeat\(|calc\(|var\(--|cubic-bezier|\bem\b|\brem\b|\bvh\b|\bvw\b|box-shadow|border-radius|^\s*[.#&@]/i;
const seen = new Set();
const rows = [];
for (const s of lits) {
  if (seen.has(s)) continue;
  if (s.length < 8 || s.length > 400) continue;
  if (!/ /.test(s)) continue;
  if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(s)) continue;
  if (!/[A-Za-z]{3}/.test(s)) continue;
  if (codeish.test(s) || cssish.test(s)) continue;
  if (/^(https?:|\/|data:|#|[0-9a-f]{6,})/i.test(s)) continue;
  if (/\\n|\\t|\\\\/.test(s)) continue;
  if (s in D) continue;
  const words = s.match(/[A-Za-z][A-Za-z'\u2019-]+/g) || [];
  if (words.length < 2) continue;
  seen.add(s); rows.push(s);
}
rows.sort((a, b) => a.localeCompare(b));
fs.writeFileSync(outPath, rows.join("\n"), "utf8");
console.log("remaining UI candidates:", rows.length, "->", outPath);
