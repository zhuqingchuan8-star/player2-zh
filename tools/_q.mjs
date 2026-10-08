import fs from "node:fs";
const D = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const probes = process.argv.slice(3);
for (const p of probes) {
  const hits = Object.keys(D).filter((k) => k.includes(p));
  if (hits.length) {
    console.log("== " + p + " ==");
    hits.slice(0, 30).forEach((k) => console.log("   " + JSON.stringify(k) + "  =>  " + JSON.stringify(D[k])));
  } else console.log("== " + p + " == (none)");
}
