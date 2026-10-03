import fs from "node:fs";
const rows=JSON.parse(fs.readFileSync("i18n/strings.en.json","utf8"));
const noise=[
 /#define/,/^#/,/^https?:/,/M[0-9]+ [0-9]/,/texture|shader|GL_|WebGL|vec[234]|uniform|attribute|varying/i,
 /splice buffer|Material Name|Program Info Log|non-minified|stack|Assertion|Invariant|deprecated|Rendered fewer|hook|props|children|element|component|render|module|source map|Node\.js/i,
 /^[\s,.:;)\]}]+$/, /=>|function|typeof|undefined|\.prototype|Object\.|Array\.|string|number|boolean/i,
 /^(error|warn|info|debug|log)$/i
];
const skipWord=/^(Aborted|Array|Atomics|Asterisk|Autocomplete|Avatar|Backdrop|Backspace|Badge|Badge|Bash|Boolean|Breadcrumbs|Chip|Cineon|Container|Dashed|Dedupe|Docked|Element|Emotion|Fragment|Integer|Variant|Viewport|Wrapper|Accordion|Snackbar|Tooltip|Slider|Switch|Checkbox|Radio|Select|Dialog|Drawer|Popover|Menu|Grid|Paper|Card|Chip|Divider|Link|Tab|Tabs|Stepper|Timeline|Tree|Table|List|Avatar|Skeleton|Progress|Alert|Badge|Tooltip|Transition|Popper|Modal|Portal|Bash|Cineon|Dedupe|Atomics|Asterisk|Boolean|Integer|Fragment|Element|Docked|Dashed|Breadcrumbs)$/;
const keep=[];
for(const r of rows){
  if(r.kind==="phrase"){
    if(noise.some(n=>n.test(r.en))) continue;
    if(!/^[A-Z0-9"'\[]/.test(r.en.trim())) continue;
    keep.push(r);
  } else {
    keep.push(r);
  }
}
fs.writeFileSync("i18n/to-translate.json",JSON.stringify(keep,null,2));
console.log("kept:",keep.length," phrases:",keep.filter(k=>k.kind==="phrase").length," labels:",keep.filter(k=>k.kind==="label").length);
const p=keep.filter(k=>k.kind==="phrase").map(k=>k.en);
const l=keep.filter(k=>k.kind==="label").map(k=>k.en);
fs.writeFileSync("i18n/_phrases.txt",p.join("\n"),"utf8");
fs.writeFileSync("i18n/_labels.txt",l.join("\n"),"utf8");
console.log("---- phrases ----"); p.forEach((s,i)=>console.log(i+" | "+s));