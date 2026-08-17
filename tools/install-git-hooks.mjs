import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hooksDir = path.join(root, ".githooks");
const gitDir = path.join(root, ".git");
const targetDir = path.join(gitDir, "hooks");

const hooks = ["pre-commit", "post-commit"];

if (!fs.existsSync(gitDir)) {
  console.log("No se encontró .git en este directorio. Omite instalación de hooks.");
  process.exit(0);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const hook of hooks) {
  const source = path.join(hooksDir, hook);
  if (!fs.existsSync(source)) {
    console.error(`No se encontró el hook fuente .githooks/${hook}.`);
    process.exit(1);
  }

  const target = path.join(targetDir, hook);
  fs.copyFileSync(source, target);

  try {
    fs.chmodSync(target, 0o755);
  } catch {
    // En Windows puede no aplicar chmod; no bloquea.
  }

  console.log(`Hook instalado: .git/hooks/${hook}`);
}
