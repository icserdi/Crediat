# Flujo de repositorio y despliegues

## Repositorio único (GitHub)

- **URL**: `git@github.com:icserdi/Crediat.git`
- **Rama principal**: `main` (producción)
- **Rama de desarrollo**: `develop` (integraciones diarias)
- **Flujo**: ramas feature → merge a `develop` → QA → merge a `main`

```bash
git clone git@github.com:icserdi/Crediat.git
git checkout -b feature/nueva-funcionalidad
# ... trabajar ...
git push -u origin feature/nueva-funcionalidad
# PR a develop → merge → QA → PR a main
```

## Releases

- Tags semánticos sobre `main`: `v0.1.0`, `v0.2.0`, etc.
- Release notes en GitHub.

```bash
git checkout main
git merge --no-ff develop
git tag v0.1.0
git push origin main --tags
```

## Entornos de despliegue

- **TEST / STAGING (opcional)**: Coolify local, apuntando a rama `develop` o tags candidatos.
- **PROD**: Dokploy local, desplegando solo tags/release validadas en `main`.

## Criterio mínimo de promoción

- `npm run validate:tracked` sin errores.
- Prueba funcional mínima en UI (login, navegación base y módulo impactado).
- Registro actualizado en `development-log.md` y `development-backlog.md`.