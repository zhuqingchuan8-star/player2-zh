// 对比新旧前端 JS 的字符串字面量，找出新增/变更的界面文案
// 用法: node tools/_delta.mjs <old.js> <new.js> <dict.json> <outdir>
import fs from "node:fs";
import path from "node:path";

const [oldJsPath, newJsPath, dictPath, outDir] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));
const outD = Object.fromEntries(Object.entries(D).map(([k, v]) => [v, k]));

function literals(js) {
  const out = new Set();
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
      out.add(js.slice(i + 1, j)); i = j + 1; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < js.length) { const d = js[j]; if (d === "\\") { j += 2; continue; } if (d === c) break; j++; }
      out.add(js.slice(i + 1, j)); i = j + 1; continue;
    }
    i++;
  }
  return out;
}

const oldJs = fs.readFileSync(oldJsPath, "utf8");
const newJs = fs.readFileSync(newJsPath, "utf8");
const Lold = literals(oldJs);
const Lnew = literals(newJs);
console.log("literals old:", Lold.size, " new:", Lnew.size);

// 1) 新增字面量（新包里出现、旧包里没有）
const added = [...Lnew].filter((s) => !Lold.has(s));
// 2) 消失的字面量（旧包里有、新包没有）
const removed = [...Lold].filter((s) => !Lnew.has(s));

const codeish = /=>|function\s*\(|\bvar\b|\bconst\b|\breturn\b|window\.|document\.|\bundefined\b|\bnull\b|process\.|\bthis\b|\\u[0-9a-f]{4}|\$\{|;\s|\{|\}|\[object|NaN|\.js\b|\.css\b|\.json\b/i;
const cssish = /\bpx\b|\brgba?\(|linear-gradient|@keyframes|@media|\.Mui|!important|translate\(|repeat\(|calc\(|var\(--|cubic-bezier|\bem\b|\brem\b|\bvh\b|\bvw\b|box-shadow|border-radius|^\s*[.#&@]/i;
const cjk = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

function uiLike(s) {
  if (s.length < 2 || s.length > 400) return false;
  if (cjk.test(s)) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (codeish.test(s) || cssish.test(s)) return false;
  if (/^(https?:|\/|data:|#|[0-9a-f]{6,})/i.test(s)) return false;
  if (/\\n|\\t|\\\\|\n/.test(s)) return false;
  if (/^[a-z0-9_.\-/:@]+$/.test(s)) return false;         // 纯 key / 路径 / 标识
  if (/[{}<>$`]/.test(s)) return false;
  const words = s.match(/[A-Za-z][A-Za-z'\u2019-]*/g) || [];
  if (words.length === 0) return false;
  if (words.length === 1) {
    const w = words[0];
    if (s.length < 3 || s.length > 22) return false;
    if (!/^[A-Z]/.test(w)) return false;                   // 单词文案需首字母大写
    if (/^[A-Z0-9_]+$/.test(w) && w.length < 4) return false;
  }
  return true;
}

const addUi = added.filter(uiLike).filter((s) => !(s in D)).sort((a, b) => a.localeCompare(b));
const addKnown = added.filter((s) => s in D).length;

// 词库中已不在新包出现的条目（文案被改动或删除）
const stale = Object.keys(D).filter((k) => !Lnew.has(k));

// 旧包里存在、新包里消失、且词库里有的条目 -> 说明该文案在新版被改写
const changedFromDict = removed.filter((s) => s in D).sort((a, b) => a.localeCompare(b));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "_delta_added_ui.txt"), addUi.join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "_delta_stale.txt"), stale.join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "_delta_changed.txt"), changedFromDict.join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "_delta_added_all.txt"), added.filter(uiLike).join("\n"), "utf8");

console.log("added literals:", added.length, " (dict-covered:", addKnown + ")");
console.log("added UI-like not in dict:", addUi.length);
console.log("dict entries missing in new bundle:", stale.length);
console.log("dict entries whose literal disappeared:", changedFromDict.length);
console.log("removed literals:", removed.length);
