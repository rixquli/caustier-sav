#!/usr/bin/env bash
set -euo pipefail

CONFIRMED=false
BACKUP_FILE=""

usage() {
  echo "Usage: $0 <backup.sql.gz> [--yes] [--url DATABASE_URL]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      CONFIRMED=true
      shift
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
      if [[ -z "$BACKUP_FILE" ]]; then
        BACKUP_FILE="$1"
      else
        usage
      fi
      shift
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required (environment variable or --url)" >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  usage
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is not installed. Install PostgreSQL client tools." >&2
  exit 1
fi

if [[ "$CONFIRMED" != true ]]; then
  echo "WARNING: This will overwrite data in the target database."
  echo "Backup file: ${BACKUP_FILE}"
  echo "Target: ${DATABASE_URL}"
  read -r -p "Type 'yes' to continue: " answer
  if [[ "$answer" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "Restoring from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "Restore completed."
