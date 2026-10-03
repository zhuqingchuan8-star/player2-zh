import fs from "node:fs"; import zlib from "node:zlib";
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const chunks=[];
await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(57612714,57612714+736578));});
const js=Buffer.concat(chunks).toString("utf8");
let i=0,c=0;
while((i=js.indexOf('"Cancel"',i))!==-1 && c<8){ console.log("---",i,JSON.stringify(js.slice(Math.max(0,i-90),i+30))); i+=8; c++; }