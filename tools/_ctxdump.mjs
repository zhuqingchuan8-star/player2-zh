// 打印候选字符串在新版 JS 中的所有出现位置及上下文
// 用法: node tools/_ctxdump.mjs <js> <list.txt> [out.txt]
import fs from "node:fs";
const [jsPath, listPath, outPath] = process.argv.slice(2);
const js = fs.readFileSync(jsPath, "utf8");
const list = fs.readFileSync(listPath, "utf8").split(/\r?\n/).map((s) => s.replace(/^\d+:\s?/, "")).filter(Boolean);
const out = [];
for (const s of list) {
  let n = 0, i = 0;
  const hits = [];
  for (;;) {
    const p = js.indexOf(s, i);
    if (p < 0) break;
    n++; i = p + s.length;
    hits.push(js.slice(Math.max(0, p - 90), Math.min(js.length, p + s.length + 90)).replace(/\s+/g, " "));
  }
  out.push(`### [${n}] ${JSON.stringify(s)}`);
  hits.slice(0, 4).forEach((h) => out.push("    " + h));
}
fs.writeFileSync(outPath, out.join("\n"), "utf8");
console.log("wrote", outPath, "entries", list.length);
