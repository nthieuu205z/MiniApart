#!/bin/sh
set -eu
umask 077
backup="${1:?Pass the full /backups/miniapart-TIMESTAMP directory}"
case "$backup" in /backups/miniapart-????????T??????Z) ;; *) echo 'Invalid backup directory' >&2; exit 1 ;; esac
(cd "$backup" && sha256sum -c SHA256SUMS)
target="miniapart_restore_$(date -u +%Y%m%d%H%M%S)"
createdb "$target"
pg_restore --exit-on-error --no-owner --no-privileges --dbname="$target" "$backup/database.dump"
listing="$(tar -tzf "$backup/attachments.tar.gz")"
if printf '%s\n' "$listing" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then echo 'Unsafe attachment archive' >&2; exit 1; fi
mkdir "/restore-attachments/$target"
tar -xzf "$backup/attachments.tar.gz" -C "/restore-attachments/$target"
psql --dbname="$target" --set=ON_ERROR_STOP=1 --command='SELECT COUNT(*) AS invoices FROM HOA_DON; SELECT COUNT(*) AS tenants FROM NGUOI_THUE; SELECT COUNT(*) AS audit_entries FROM NHAT_KY_THAO_TAC;'
echo "Restored into $target and /restore-attachments/$target. The active database and attachments were untouched."
