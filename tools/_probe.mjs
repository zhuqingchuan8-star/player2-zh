import fs from "node:fs"; import zlib from "node:zlib";
const buf=fs.readFileSync("D:\\ruanjian\\player2\\player2.exe");
const start=57612714, gap=736578;
let run=0, found=-1;
for(let i=start;i<start+gap+5000;i++){
  const b=buf[i];
  if(b>=0x20&&b<0x7f){ run++; if(run>=24){ found=i-23; break; } } else run=0;
}
console.log("first printable run offset:", found, "=> blob length approx:", found<0? "none": found-start);
const js=fs.readFileSync(process.argv[2]);
console.log("orig js bytes:", js.length);
for(const q of [9,10,11]){
  const t=Date.now();
  const c=zlib.brotliCompressSync(js,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:q,[zlib.constants.BROTLI_PARAM_SIZE_HINT]:js.length}});
  console.log("brotli q"+q+":", c.length, "("+(Date.now()-t)+"ms)");
}