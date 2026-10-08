// 精确统计 "字面量" 出现次数并打印上下文（与 patch-exe 的替换口径一致）
// 用法: node tools/_exact.mjs <js> <list.txt> <out.txt>
import fs from "node:fs";
const [jsPath, listPath, outPath] = process.argv.slice(2);
const js = fs.readFileSync(jsPath, "utf8");
const list = fs.readFileSync(listPath, "utf8").split(/\r?\n/).map((s) => s.replace(/^\uFEFF/, "").replace(/^\d+:\s?/, "")).filter(Boolean);
const out = [];
for (const s of list) {
  const hits = [];
  for (const q of ['"', "'"]) {
    const needle = q + s + q;
    let i = 0;
    for (;;) {
      const p = js.indexOf(needle, i);
      if (p < 0) break;
      i = p + needle.length;
      hits.push(js.slice(Math.max(0, p - 110), Math.min(js.length, p + needle.length + 110)).replace(/\s+/g, " "));
    }
  }
  out.push(`### [${hits.length}] ${JSON.stringify(s)}`);
  hits.slice(0, 6).forEach((h) => out.push("    " + h));
}
fs.writeFileSync(outPath, out.join("\n"), "utf8");
console.log("wrote", outPath);
