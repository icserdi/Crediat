# Flujo de repositorios y despliegues

Definición operativa para usar:

- **Gitea** como repositorio principal de desarrollo.
- **GitHub** como repositorio final de productivo (releases validadas).
- **Coolify local** para despliegues de TEST (y Staging si aplica).
- **Dokploy local** para despliegue PROD.

## 1) Repositorio principal (Gitea)

- Flujo diario: ramas feature -> merge a `develop` en Gitea.
- Integraciones técnicas y validación funcional ocurren primero en Gitea.

Comandos sugeridos (una sola vez):

```bash
git init
git remote add origin-gitea <URL_GITEA>
git remote add origin-github <URL_GITHUB>
git checkout -b develop
git push -u origin-gitea develop
```

## 2) Repositorio productivo (GitHub)

- Solo recibe código validado desde Gitea.
- Publicación recomendada: tags semánticos (`v0.1.0`, `v0.2.0`, etc.) y release notes.

Comandos sugeridos para promover release:

```bash
git checkout main
git merge --no-ff develop
git push origin-gitea main
git push origin-github main
git tag v0.1.0
git push origin-github v0.1.0
```

## 3) Entornos de despliegue

- **TEST / STAGING (opcional)**: Coolify local, apuntando a rama `develop` o tags candidatos.
- **PROD**: Dokploy local, desplegando solo tags/release validadas.

## 4) Criterio mínimo de promoción entre plataformas

- `npm run validate:tracked` ejecutado sin errores.
- Prueba funcional mínima en UI (login, navegación base y módulo impactado).
- Registro actualizado en `development-log.md` y `development-backlog.md`.
