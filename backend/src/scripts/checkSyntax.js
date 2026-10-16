import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

async function collect(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (extname(entry.name) === ".js") files.push(path);
  }
  return files;
}
const files = await collect("src");
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) { failed = true; process.stderr.write(`\nFAIL ${file}\n${result.stderr}`); }
}
if (failed) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
