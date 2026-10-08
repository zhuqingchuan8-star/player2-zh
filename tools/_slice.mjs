// 按锚点导出 JS 片段（换行包裹便于阅读）
// 用法: node tools/_slice.mjs <js> <anchor> <before> <after> <out.txt>
import fs from "node:fs";
const [jsPath, anchor, before, after, out] = process.argv.slice(2);
const js = fs.readFileSync(jsPath, "utf8");
const p = js.indexOf(anchor);
if (p < 0) { console.log("anchor not found"); process.exit(1); }
const s = js.slice(Math.max(0, p - Number(before)), Math.min(js.length, p + Number(after)));
const wrapped = s.replace(/(.{1,300})/g, "$1\n");
fs.writeFileSync(out, wrapped, "utf8");
console.log("anchor at", p, "slice", s.length, "->", out);
