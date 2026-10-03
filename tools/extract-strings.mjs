// Build an English UI-string inventory from the extracted frontend bundle.
// Usage: node tools/extract-strings.mjs frontend i18n
import fs from "node:fs";
import path from "node:path";

const frontend = process.argv[2] || "frontend";
const outDir = process.argv[3] || "i18n";
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|html|css|json)$/.test(e.name)) files.push(p);
  }
})(frontend);

function literals(src) {
  const out = [];
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1, s = "";
      while (j < src.length) {
        const d = src[j];
        if (d === "\\") { s += src[j + 1]; j += 2; continue; }
        if (d === c) break;
        s += d; j++;
      }
      out.push(s); i = j + 1;
    } else i++;
  }
  return out;
}

const noise = /(Sentry|THREE\.|WebGL|Profiling|Tracing|Measurements|\[object|WebAssembly|Minified React|Invariant Violation|react-|@testing|node_modules|Mui|material-ui|Emotion|styled-|swagger|OpenAPI)/i;
const ascii = /^[A-Za-z0-9 ,.'!?%&:()\-+*#@\[\]\n\r\t\u2019\u201C]+$/;

function isPhrase(s) {
  if (s.length < 3 || s.length > 200) return false;
  if (/[\u4e00-\u9fff]/.test(s)) return false;
  if (s.includes("http") || s.includes("/") || s.includes("\\") || s.includes("www.")) return false;
  if (/[{}<>;=|`]/.test(s) || noise.test(s)) return false;
  if (!/[A-Za-z]/.test(s) || !s.includes(" ")) return false;
  if (!ascii.test(s)) return false;
  if (/^[MZLHVCSQTA][0-9\s.,-]+$/.test(s.trim())) return false;
  if (/^[A-Za-z_]+\.[A-Za-z_]/.test(s)) return false;
  if (s.trim().split(/\s+/).length < 2) return false;
  if (/^(var|const|function|return|typeof|undefined|null|true|false)$/.test(s)) return false;
  if (/^[0-9]/.test(s.trim())) return false;
  return true;
}
function isLabel(s) {
  if (!/^[A-Z][a-z]{2,14}$/.test(s)) return false;
  if (noise.test(s)) return false;
  return true;
}

const all = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const s of literals(src)) all.add(s);
}
const phrases = [...all].filter(isPhrase).sort();
const labels = [...all].filter(isLabel).sort();
const rows = [];
let n = 0;
for (const en of phrases) rows.push({ id: "p" + String(++n).padStart(4, "0"), kind: "phrase", en });
for (const en of labels) rows.push({ id: "l" + String(++n).padStart(4, "0"), kind: "label", en });

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "strings.en.json"), JSON.stringify(rows, null, 2));
console.log("files scanned:", files.length);
console.log("unique literals:", all.size);
console.log("phrases:", phrases.length, " labels:", labels.length, " total:", rows.length);