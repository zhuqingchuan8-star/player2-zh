import fs from "node:fs";
const js = fs.readFileSync(process.argv[2], "utf8");
for (const needle of process.argv.slice(3)) {
  let i = js.indexOf(needle);
  console.log("needle", JSON.stringify(needle), "count0?", i < 0);
  if (i >= 0) console.log("   ctx:", JSON.stringify(js.slice(Math.max(0, i - 30), i + needle.length + 60)));
}
