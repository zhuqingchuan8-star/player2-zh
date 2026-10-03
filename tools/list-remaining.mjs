// 列出汉化后仍残留的英文界面文案（属性字符串 + children 数组内联文本）
// 用法: node tools/list-remaining.mjs out/player2.zh.exe
import fs from "node:fs"; import zlib from "node:zlib";
const exe = process.argv[2];
const buf = fs.readFileSync(exe);
const isPath = (b)=> (b>=0x30&&b<=0x39)||(b>=0x41&&b<=0x5a)||(b>=0x61&&b<=0x7a)||b===0x2f||b===0x2e||b===0x2d||b===0x5f;
const keys=[]; for(let i=0;i<buf.length;){ if(buf[i]!==0x2f){i++;continue;} let j=i; while(j<buf.length&&isPath(buf[j]))j++;
  if(j>i+3){const s=buf.toString("latin1",i,j); if(/\.(js|css|html|json)$/.test(s))keys.push({off:i,key:s});} i=j>i?j:i+1; }
const main=keys.filter(k=>/^\/assets\/index-.*\.js$/.test(k.key)).sort((a,b)=>a.off-b.off)[0];
const start=main.off+main.key.length;
const after=keys.filter(k=>k.off>start).map(k=>k.off).sort((a,b)=>a-b);
const end=after.length?after[0]:buf.length;
const js=await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();const c=[];d.on("data",x=>c.push(x));d.on("end",()=>res(Buffer.concat(c).toString("utf8")));d.on("error",rej);d.end(buf.subarray(start,end));});

const out=new Set();
const props="children|label|placeholder|title|helperText|subtitle|heading|aria-label|alt|tooltip|description|text|buttonText|emptyText|confirmText|cancelText|message|content";
const reProp=new RegExp('(?:'+props+')\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"',"g");
let m; while((m=reProp.exec(js))!==null) out.add(m[1]);
// children 数组内的字符串
const reArr=/children:\s*\[/g;
while((m=reArr.exec(js))!==null){
  let i=m.index+m[0].length, depth=1;
  while(i<js.length&&depth>0){
    const c=js[i];
    if(c==="[")depth++;
    else if(c==="]")depth--;
    else if(c==='"'){ let j=i+1,s=""; while(j<js.length){const d=js[j]; if(d==="\\"){s+=js[j+1];j+=2;continue;} if(d==='"')break; s+=d; j++;} out.add(s); i=j; }
    i++;
  }
}
const bad=/[\u4e00-\u9fff]/;
const isCode=(s)=> /[{}<>;=|]|=>|https?:|^[a-z0-9_\-\.\/]*$|rgba\(|^\//.test(s);
const rows=[...out].filter(s=>s.length>=6 && /[A-Za-z]/.test(s) && !bad.test(s) && !isCode(s) && / /.test(s));
rows.sort((a,b)=>a.localeCompare(b));
console.log("remaining English candidates:",rows.length);
fs.writeFileSync("i18n/_remain2.txt",rows.join("\n"),"utf8");
rows.forEach(s=>console.log(s));