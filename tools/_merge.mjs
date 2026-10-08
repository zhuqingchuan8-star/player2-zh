// 合并新增词条/上下文条目，并逐条校验英文原文确实存在于新版前端包中
// 用法: node tools/_merge.mjs <js> <dict.json> <newEntries.json> <context.json> <newContext.json>
import fs from "node:fs";
const [jsPath, dictPath, newEntriesPath, ctxPath, newCtxPath] = process.argv.slice(2);
const js = fs.readFileSync(jsPath, "utf8");
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));
const C = fs.existsSync(ctxPath) ? JSON.parse(fs.readFileSync(ctxPath, "utf8")) : {};
const NE = JSON.parse(fs.readFileSync(newEntriesPath, "utf8"));
const NC = JSON.parse(fs.readFileSync(newCtxPath, "utf8"));

const count = (s, sub) => { let n = 0, i = 0; for (;;) { const p = s.indexOf(sub, i); if (p < 0) break; n++; i = p + sub.length; } return n; };

let bad = 0;
console.log("--- 校验新词条（要求以 \"原文\" 字面量形式出现） ---");
for (const en of Object.keys(NE)) {
  const n = count(js, '"' + en + '"') + count(js, "'" + en + "'");
  const raw = count(js, en);
  const flag = n > 0 ? "OK " : (raw > 0 ? "RAW" : "MISS");
  if (n === 0) bad++;
  console.log(`  ${flag} [${n}/${raw}] ${JSON.stringify(en.slice(0, 70))}`);
}
console.log("--- 校验上下文条目（要求原文片段出现） ---");
for (const from of Object.keys(NC)) {
  const n = count(js, from);
  if (n === 0) bad++;
  console.log(`  ${n > 0 ? "OK " : "MISS"} [${n}] ${JSON.stringify(from.slice(0, 70))}`);
}
if (bad) { console.log("有", bad, "条未通过校验，已中止合并"); process.exit(1); }

let added = 0;
for (const [en, zh] of Object.entries(NE)) { if (!(en in D)) { D[en] = zh; added++; } else if (D[en] !== zh) console.log("  已存在但译法不同:", JSON.stringify(en)); }
let addedCtx = 0;
for (const [from, to] of Object.entries(NC)) { if (!(from in C)) { C[from] = to; addedCtx++; } else if (C[from] !== to) console.log("  上下文已存在但不同:", JSON.stringify(from)); }

fs.writeFileSync(dictPath, JSON.stringify(D, null, 2), "utf8");
fs.writeFileSync(ctxPath, JSON.stringify(C, null, 2), "utf8");
console.log(`merged: dict +${added} -> ${Object.keys(D).length} 条; context +${addedCtx} -> ${Object.keys(C).length} 条`);
