import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, ".githooks", "post-commit");
const gitDir = path.join(root, ".git");
const targetDir = path.join(gitDir, "hooks");
const target = path.join(targetDir, "post-commit");

if (!fs.existsSync(gitDir)) {
  console.log("No se encontró .git en este directorio. Omite instalación de hooks.");
  process.exit(0);
}

if (!fs.existsSync(source)) {
  console.error("No se encontró el hook fuente .githooks/post-commit.");
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(source, target);

try {
  fs.chmodSync(target, 0o755);
} catch {
  // En Windows puede no aplicar chmod; no bloquea.
}

console.log("Hook instalado: .git/hooks/post-commit");
