import fs from "node:fs"; import zlib from "node:zlib";
const buf=fs.readFileSync("out/player2.zh.exe");
const chunks=[];
await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(57612714,57612714+736578));});
const js=Buffer.concat(chunks).toString("utf8");
const props="children|label|placeholder|title|helperText|subtitle|heading|aria-label|alt|tooltip|description|text|buttonText|emptyText";
const re=new RegExp('(?:'+props+')\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"',"g");
const cnt=new Map(); let m;
while((m=re.exec(js))!==null){ const s=m[1];
  if(!/[A-Za-z]/.test(s)) continue;
  if(/[\u4e00-\u9fff]/.test(s)) continue;
  if(s.includes("http")||s.includes("rgba")||s.includes("/")||s.includes("{")) continue;
  if(s.length<2||s.length>120) continue;
  cnt.set(s,(cnt.get(s)||0)+1);
}
const rows=[...cnt.entries()].sort((a,b)=>b[1]-a[1]);
console.log("remaining English UI literals:",rows.length);
rows.slice(0,230).forEach(([s,c])=>console.log(c+"\t"+s));