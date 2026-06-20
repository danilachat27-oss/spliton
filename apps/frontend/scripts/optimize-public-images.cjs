const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const imagesRoot = path.join(__dirname, "..", "public", "images");
function dirSize(dir){ if(!fs.existsSync(dir)) return 0; let t=0; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); t+= e.isDirectory()?dirSize(p):fs.statSync(p).size;} return t; }
function rm(p){ if(!fs.existsSync(p)) return 0; const s=fs.statSync(p).isDirectory()?dirSize(p):fs.statSync(p).size; fs.rmSync(p,{recursive:true,force:true}); console.log("Removed", p, (s/1024/1024).toFixed(2)+"MB"); return s; }
let saved=0;
for (const rel of ["книга","выплаты"]) saved += rm(path.join(imagesRoot, rel));
saved += rm(path.join(imagesRoot, "catalog", "ничего не-Photoroom.png"));
saved += rm(path.join(imagesRoot, "'vbntn", "1.png"));
const heroDir = path.join(imagesRoot, "hero-journey");
for (const name of ["1.png","2.png","3.png"]) {
  const png = path.join(heroDir, name);
  if (!fs.existsSync(png)) continue;
  const webp = png.replace(/\.png$/i, ".webp");
  const before = fs.statSync(png).size;
  execFileSync("npx", ["--yes", "sharp-cli", png, "--webp", "--quality", "82", "--output", webp], { stdio: "inherit", shell: true, cwd: path.join(__dirname, "..") });
  const after = fs.statSync(webp).size;
  fs.unlinkSync(png);
  console.log("WebP", name, (before/1024).toFixed(0)+"KB ->", (after/1024).toFixed(0)+"KB");
  saved += before - after;
}
console.log("TOTAL_SAVED_MB", (saved/1024/1024).toFixed(2));