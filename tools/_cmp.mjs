// 比较：新版扫描结果 vs 旧版项目里已审过的清单
import fs from "node:fs";
const [newScan, oldDir, outDir] = process.argv.slice(2);
const ref = new Set();
const names = fs.readdirSync(oldDir).filter((f) => /\.(txt|json)$/.test(f));
for (const n of names) {
  const p = oldDir + "/" + n;
  const txt = fs.readFileSync(p, "utf8");
  if (n.endsWith(".json")) {
    try {
      const J = JSON.parse(txt);
      if (Array.isArray(J)) J.forEach((x) => typeof x === "string" && ref.add(x));
      else for (const k of Object.keys(J)) ref.add(k);
    } catch {}
  }
  txt.split(/\r?\n/).forEach((l) => l && ref.add(l));
}
const fresh = fs.readFileSync(newScan, "utf8").split(/\r?\n/).filter(Boolean);
const newOnes = fresh.filter((s) => !ref.has(s));
fs.writeFileSync(outDir + "/_scan_new_only.txt", newOnes.join("\n"), "utf8");
console.log("reference strings:", ref.size, " new scan:", fresh.length, " genuinely new:", newOnes.length);
