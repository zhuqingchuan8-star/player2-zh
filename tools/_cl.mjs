import fs from "node:fs";
const raw=fs.readFileSync("i18n/_ui.txt","utf8").split("\n").filter(Boolean);
const junk=/[{};=<>|`]|=>|rgba\(|^\$|^[^A-Za-z0-9\u4e00-\u9fff]?$|^K$/;
const clean=[...new Set(raw.filter(s=>!junk.test(s)))].sort((a,b)=>a.localeCompare(b));
fs.writeFileSync("i18n/_ui_clean.txt",clean.join("\n"),"utf8");
console.log("clean UI strings:",clean.length);
console.log("total chars:",clean.reduce((a,b)=>a+b.length,0));