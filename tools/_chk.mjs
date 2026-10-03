import fs from "node:fs"; import zlib from "node:zlib";
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const start=57612714;
const chunks=[]; await new Promise((res,rej)=>{const d=zlib.createBrotliDecompress();d.on("data",c=>chunks.push(c));d.on("end",res);d.on("error",rej);d.end(buf.subarray(start,start+736578));});
const js=Buffer.concat(chunks).toString("utf8");
console.log("bundle len:",js.length);
for(const s of ["主页","取消","积分","聊天","Home","Cancel","Credits","Search games and mods","AI Story","Indie Games"]) console.log(JSON.stringify(s), js.includes(s));