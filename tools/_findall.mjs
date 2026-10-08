import fs from "node:fs";
const js = fs.readFileSync(process.argv[2], "utf8");
const [prefix, ...needles] = process.argv.slice(3);
for (const needle of needles.length ? needles : [prefix]) {
  let i = 0, n = 0;
  for (;;) {
    const p = js.indexOf(needle, i);
    if (p < 0) break;
    n++; i = p + needle.length;
    console.log(`#${n}`, JSON.stringify(js.slice(Math.max(0, p - 120), p + needle.length + 120)));
  }
  console.log("total", n);
}
