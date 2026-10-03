import fs from "node:fs"; import zlib from "node:zlib";
const D=JSON.parse(fs.readFileSync("i18n/zh-CN.json","utf8"));
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const chunks=[];
await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(57612714,57612714+736578));});
const js=Buffer.concat(chunks).toString("utf8");
const re=/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
let total=0, cancel=0, hits=0; const hitList=[];
let m;
while((m=re.exec(js))!==null){
  total++;
  const inner=m[0].slice(1,-1);
  if(inner==="Cancel") cancel++;
  if(Object.prototype.hasOwnProperty.call(D,inner)){ hits++; if(hitList.length<15) hitList.push(inner); }
}
console.log("total",total,"inner==Cancel",cancel,"hits",hits);
console.log(hitList);