import fs from "node:fs";
const js=fs.readFileSync("frontend/assets_index-DMyQ34c8.js","utf8");
// capture literals used in UI positions
const props=["children","label","placeholder","title","helperText","subtitle","heading","aria-label","alt","tooltip","description","text","confirmText","cancelText","emptyText","buttonText","dialog_text","ok_button_text","cancel_button_text"];
const set=new Map();
const re=new RegExp('(?:' + props.map(p=>p.replace(/[-]/g,"\\-")).join("|") + ')\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"',"g");
let m;
while((m=re.exec(js))!==null){ const s=m[1]; if(!set.has(s)) set.set(s,0); set.set(s,set.get(s)+1); }
const bad=/^$|^[\s\d]+$|^[a-z0-9_\-\.\/]*$|^\//;
const rows=[...set.entries()].filter(([s])=>!bad.test(s) && !/[\u4e00-\u9fff]/.test(s));
rows.sort((a,b)=>b[1]-a[1]);
console.log("UI-position strings:",rows.length);
fs.writeFileSync("i18n/_ui.txt",rows.map(r=>r[0]).join("\n"),"utf8");
rows.slice(0,120).forEach(([s,c])=>console.log(c+"\t"+s));