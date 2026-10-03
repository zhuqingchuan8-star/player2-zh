import fs from "node:fs"; import zlib from "node:zlib";
const D=JSON.parse(fs.readFileSync("i18n/zh-CN.json","utf8"));
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const chunks=[];
await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(57612714,57612714+736578));});
const js=Buffer.concat(chunks).toString("utf8");
let n=0, ex=[];
const re=/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
js.replace(re,(m)=>{ const inner=m.slice(1,-1);
  if(Object.prototype.hasOwnProperty.call(D,inner)){ n++; if(ex.length<10) ex.push(m+" => "+D[inner]); }
  return m; });
console.log("direct hit count:",n);
console.log(ex);