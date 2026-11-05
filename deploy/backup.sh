#!/bin/sh
set -eu
umask 077
backup_once() {
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  stage="/backups/.pending-$stamp"
  final="/backups/miniapart-$stamp"
  mkdir -p "$stage"
  pg_dump --format=custom --no-owner --file="$stage/database.dump"
  tar -czf "$stage/attachments.tar.gz" -C /attachments .
  (cd "$stage" && sha256sum database.dump attachments.tar.gz > SHA256SUMS)
  mv "$stage" "$final"
  echo "Backup complete: $final"
  # Retain at least the latest 30 complete backups. Pending/other directories are untouched.
  find /backups -mindepth 1 -maxdepth 1 -type d -name 'miniapart-????????T??????Z' | sort -r | tail -n +31 | while IFS= read -r old; do
    case "$old" in /backups/miniapart-????????T??????Z) rm -rf -- "$old" ;; *) exit 1 ;; esac
  done
}
if [ "${1:-once}" = "loop" ]; then
  while :; do backup_once; sleep 86400; done
else
  backup_once
fi
