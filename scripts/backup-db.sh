#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="backups"
KEEP_DAYS=""

usage() {
  echo "Usage: $0 [--keep-days N] [--url DATABASE_URL]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep-days)
      KEEP_DAYS="${2:-}"
      shift 2
      ;;
    --url)
      DATABASE_URL="${2:-}"
      export DATABASE_URL
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      usage
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required (environment variable or --url)" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump is not installed. Install PostgreSQL client tools." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT="${BACKUP_DIR}/caustier_sav_${TIMESTAMP}.sql.gz"

echo "Creating backup: ${OUTPUT}"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT"
echo "Backup created successfully."

if [[ -n "$KEEP_DAYS" ]]; then
  find "$BACKUP_DIR" -name "caustier_sav_*.sql.gz" -type f -mtime +"$KEEP_DAYS" -delete
  echo "Removed backups older than ${KEEP_DAYS} days."
fi
