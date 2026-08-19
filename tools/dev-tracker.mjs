import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const logPath = path.join(root, 'development-log.md');
const backlogPath = path.join(root, 'development-backlog.md');

const args = new Set(process.argv.slice(2));
const isValidated = args.has('--validated');
const isCheckpoint = args.has('--checkpoint') || isValidated;

const now = new Date();
const iso = now.toISOString();

function safeCmd(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'n/a';
  }
}

function ensureFile(filePath, fallbackContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fallbackContent, 'utf8');
  }
}

function appendValidatedLog() {
  ensureFile(
    logPath,
    ['# Development Log', '', 'Registro cronológico de cambios validados.', ''].join('\n')
  );

  const branch = safeCmd('git rev-parse --abbrev-ref HEAD');
  const commit = safeCmd('git rev-parse --short HEAD');
  const actor = process.env.USERNAME || process.env.USER || 'dev';
  const note = process.env.DEV_LOG_NOTE || 'Validación técnica (typecheck + lint).';

  const entry = [
    '',
    `## ${iso}`,
    '',
    `- Estado: VALIDADO`,
    `- Autor: ${actor}`,
    `- Branch: ${branch}`,
    `- Commit base: ${commit}`,
    `- Nota: ${note}`,
  ].join('\n');

  fs.appendFileSync(logPath, entry, 'utf8');
}

function updateBacklogCheckpoint() {
  ensureFile(
    backlogPath,
    [
      '# Development Backlog',
      '',
      'Seguimiento operativo del avance contra `roadmap.md`.',
      '',
      '<!-- AUTO:LAST_VALIDATED_START -->',
      '- Última validación automática: pendiente',
      '<!-- AUTO:LAST_VALIDATED_END -->',
      '',
      '<!-- AUTO:NEXT_STEP_START -->',
      '- Próximo paso sugerido: iniciar Sprint 0 (conector SAP B1 y contratos base).',
      '<!-- AUTO:NEXT_STEP_END -->',
      '',
    ].join('\n')
  );

  const nextStep =
    process.env.DEV_NEXT_STEP ||
    'continuar Sprint 0: conector SAP B1, catálogo de empresas y reglas de acceso por usuario.';

  const source = fs.readFileSync(backlogPath, 'utf8');
  const withValidated = source.replace(
    /<!-- AUTO:LAST_VALIDATED_START -->[\s\S]*?<!-- AUTO:LAST_VALIDATED_END -->/m,
    [
      '<!-- AUTO:LAST_VALIDATED_START -->',
      `- Última validación automática: ${iso}`,
      '<!-- AUTO:LAST_VALIDATED_END -->',
    ].join('\n')
  );

  const withNextStep = withValidated.replace(
    /<!-- AUTO:NEXT_STEP_START -->[\s\S]*?<!-- AUTO:NEXT_STEP_END -->/m,
    [
      '<!-- AUTO:NEXT_STEP_START -->',
      `- Próximo paso sugerido: ${nextStep}`,
      '<!-- AUTO:NEXT_STEP_END -->',
    ].join('\n')
  );

  fs.writeFileSync(backlogPath, withNextStep, 'utf8');
}

if (isValidated) appendValidatedLog();
if (isCheckpoint) updateBacklogCheckpoint();

if (!isValidated && !isCheckpoint) {
  process.stdout.write('Uso: node tools/dev-tracker.mjs --validated | --checkpoint\n');
  process.exit(1);
}

process.stdout.write('Tracker actualizado correctamente.\n');
