// 回归检查：汉化版里仍未翻译的候选串 vs 已审清单（旧项目全部清单 + 本轮新译条目）
import fs from "node:fs";
const [scanFile, refDir, refJson, outFile] = process.argv.slice(2);
const ref = new Set();
for (const n of fs.readdirSync(refDir).filter((f) => /\.(txt|json)$/.test(f))) {
  const p = refDir + "/" + n;
  const txt = fs.readFileSync(p, "utf8");
  if (n.endsWith(".json")) {
    try { const J = JSON.parse(txt); if (Array.isArray(J)) J.forEach((x) => typeof x === "string" && ref.add(x)); else Object.keys(J).forEach((k) => ref.add(k)); } catch {}
  }
  txt.split(/\r?\n/).forEach((l) => l && ref.add(l));
}
for (const p of refJson.split(";").filter(Boolean)) {
  try { const J = JSON.parse(fs.readFileSync(p, "utf8")); Object.keys(J).forEach((k) => ref.add(k)); } catch (e) { console.log("skip", p, e.message); }
}
const left = fs.readFileSync(scanFile, "utf8").split(/\r?\n/).filter(Boolean);
const newOnes = left.filter((s) => !ref.has(s));
fs.writeFileSync(outFile, newOnes.join("\n"), "utf8");
console.log("scan:", left.length, " not-in-review-list:", newOnes.length, "->", outFile);
