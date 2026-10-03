import fs from "node:fs";
const rows=JSON.parse(fs.readFileSync("i18n/strings.en.json","utf8"));
let sum=0,max=0; for(const r of rows){ sum+=Buffer.byteLength(r.en,"utf8"); max=Math.max(max,r.en.length); }
console.log("count:",rows.length,"total en text bytes:",sum,"longest:",max);
console.log("sample phrases:"); rows.filter(r=>r.kind==="phrase").slice(0,12).forEach(r=>console.log("  "+r.en));
console.log("sample labels:"); rows.filter(r=>r.kind==="label").slice(0,20).forEach(r=>console.log("  "+r.en));