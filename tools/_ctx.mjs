import fs from "node:fs"; import zlib from "node:zlib";
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const chunks=[]; await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(57612714,57612714+736578));});
const js=Buffer.concat(chunks).toString("utf8");
let i=0,c=0;
while((i=js.indexOf("Home",i))!==-1 && c<12){ console.log("---", i, JSON.stringify(js.slice(Math.max(0,i-70), i+70))); i+=4; c++; }
console.log("==== 主页 occurrences:", js.split("主页").length-1);