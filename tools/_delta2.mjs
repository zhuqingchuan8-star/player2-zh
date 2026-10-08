// 用 scan-all 同款词法分析器对比新旧 JS，输出新增/消失的属性型文案与字面量
// 用法: node tools/_delta2.mjs <old.js> <new.js> <dict.json> <outDir>
import fs from "node:fs";
import path from "node:path";

const [oldJsPath, newJsPath, dictPath, outDir] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(dictPath, "utf8"));

function lex(js) {
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
  return lits;
}

const props = "children|label|placeholder|title|helperText|subtitle|heading|aria-label|alt|tooltip|description|text|buttonText|emptyText|primaryText|secondaryText|content|message|name|value";
const propRe = new RegExp("(?:" + props + ")\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"", "g");
function propValues(js) {
  const out = new Map();
  let m;
  propRe.lastIndex = 0;
  while ((m = propRe.exec(js)) !== null) {
    const v = m[1];
    if (!out.has(v)) out.set(v, m[0].slice(0, m[0].indexOf(":")).trim());
  }
  return out;
}

const oldJs = fs.readFileSync(oldJsPath, "utf8");
const newJs = fs.readFileSync(newJsPath, "utf8");
const Lold = new Set(lex(oldJs));
const Lnew = new Set(lex(newJs));
const Pold = propValues(oldJs);
const Pnew = propValues(newJs);

const cjk = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
const noise = /=>|function\s*\(|\breturn\b|window\.|document\.|process\.|\$\{|\[object|\.js\b|\.css\b|\.json\b|^\s*[.#&@]|\bpx\b|rgba?\(|transitions\.|palette\.|ownerState|^\s*[,:;)]|[,;:]$|^[a-z]+\(/;
function uiish(s) {
  if (s.length < 2 || s.length > 500) return false;
  if (cjk.test(s)) return false;
  if (noise.test(s)) return false;
  if (/\\n|\\t|\\\\|\n/.test(s)) return false;
  if (/^(https?:|\/|data:|#)/i.test(s)) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  if (/[{}<>$`=;]/.test(s)) return false;
  if (/^[a-z0-9_.\-/:@ ]+$/.test(s)) return false;   // 全小写 -> 多为 key/类名
  return true;
}

const addedProps = [...Pnew.keys()].filter((v) => !Pold.has(v) && uiish(v) && !(v in D));
const goneProps = [...Pold.keys()].filter((v) => !Pnew.has(v) && uiish(v) && v in D);
const addedLits = [...Lnew].filter((s) => !Lold.has(s) && uiish(s) && !(s in D));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "_added_props.txt"), addedProps.sort((a, b) => a.localeCompare(b)).join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "_gone_props.txt"), goneProps.sort((a, b) => a.localeCompare(b)).join("\n"), "utf8");
fs.writeFileSync(path.join(outDir, "_added_lits.txt"), addedLits.sort((a, b) => a.localeCompare(b)).join("\n"), "utf8");
console.log("props old/new:", Pold.size, Pnew.size, "| lits old/new:", Lold.size, Lnew.size);
console.log("added prop-values:", addedProps.length, "| prop-values whose text vanished:", goneProps.length, "| added literals:", addedLits.length);
