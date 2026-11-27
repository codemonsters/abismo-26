#!/usr/bin/env bash
# Reconstruye la imagen del servidor de lobbies y vuelve a crear su contenedor
# para publicar el código descargado con github.sh --pull.
# Uso: ./abismo-26/lobby-server/scripts/deploy.sh
#
# Variables opcionales:
#   COMPOSE_DIR  Carpeta con el docker-compose.yaml (por defecto, la carpeta
#                que contiene el repositorio abismo-26).
#   SERVICE      Nombre del servicio en el compose (por defecto abismo-lobby).
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMPOSE_DIR="${COMPOSE_DIR:-$(dirname "$REPO_DIR")}"
SERVICE="${SERVICE:-abismo-lobby}"

COMPOSE_FILE=""
for f in docker-compose.yaml docker-compose.yml compose.yaml compose.yml; do
    if [[ -f "$COMPOSE_DIR/$f" ]]; then
        COMPOSE_FILE="$COMPOSE_DIR/$f"
        break
    fi
done
if [[ -z "$COMPOSE_FILE" ]]; then
    echo "Error: no hay ningún docker-compose.yaml en $COMPOSE_DIR (usa COMPOSE_DIR=...)" >&2
    exit 1
fi

compose() {
    docker compose --project-directory "$COMPOSE_DIR" -f "$COMPOSE_FILE" "$@"
}

if ! SERVICES="$(compose config --services)"; then
    echo "Error: $COMPOSE_FILE no es válido (ver el mensaje de docker compose de arriba)." >&2
    echo "Corrígelo y compruébalo con: docker compose config --quiet" >&2
    exit 1
fi
if ! grep -qx "$SERVICE" <<<"$SERVICES"; then
    echo "Error: el servicio '$SERVICE' no está definido en $COMPOSE_FILE" >&2
    exit 1
fi

echo "==> Desplegando $SERVICE (commit $(git -C "$REPO_DIR" log -1 --format='%h %s'))"

# Se construye antes de parar para que, si el build falla, siga funcionando el servidor anterior.
echo "==> Construyendo la imagen..."
compose build --pull "$SERVICE"

echo "==> Deteniendo el contenedor actual..."
compose stop "$SERVICE"

echo "==> Creando y arrancando el contenedor nuevo..."
compose up -d --force-recreate --no-deps "$SERVICE"

echo "==> Borrando imágenes antiguas sin usar..."
docker image prune -f >/dev/null

echo "==> Estado:"
compose ps "$SERVICE"
sleep 2
echo "==> Últimas líneas del log:"
compose logs --tail 20 "$SERVICE"
