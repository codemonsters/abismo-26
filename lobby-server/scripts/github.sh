#!/usr/bin/env bash
# Sincroniza el repositorio local con GitHub.
# Uso: ./abismo-26/lobby-server/scripts/github.sh --pull
set -euo pipefail

usage() {
    cat <<USAGE
Uso: $(basename "$0") [opción]

Opciones:
  --pull    Descarga los últimos cambios de GitHub (git pull --ff-only)
            en la rama actual del repositorio.
  --help    Muestra esta ayuda.

Después de --pull, ejecuta deploy.sh para publicar los cambios en el contenedor.
USAGE
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

do_pull() {
    cd "$REPO_DIR"
    local branch
    branch="$(git rev-parse --abbrev-ref HEAD)"

    if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
        echo "Error: hay cambios locales sin commitear en $REPO_DIR:" >&2
        git status --short --untracked-files=no >&2
        echo "Guárdalos (git stash) o descártalos antes de actualizar." >&2
        exit 1
    fi

    echo "==> Actualizando $REPO_DIR (rama $branch) desde GitHub..."
    local before after
    before="$(git rev-parse HEAD)"
    git fetch --prune
    git pull --ff-only
    after="$(git rev-parse HEAD)"

    if [[ "$before" == "$after" ]]; then
        echo "==> Ya estaba actualizado."
    else
        echo "==> Cambios descargados:"
        git log --oneline "$before..$after"
    fi
    echo "==> Commit actual: $(git log -1 --format='%h %s (%an, %ar)')"
}

if [[ $# -eq 0 ]]; then
    usage
    exit 0
fi

case "$1" in
    --pull) do_pull ;;
    -h|--help) usage ;;
    *)
        echo "Opción desconocida: $1" >&2
        usage >&2
        exit 2
        ;;
esac
