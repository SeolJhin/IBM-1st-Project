-- 1) Export active rows for S3 key audit (csv)
-- mysql --default-character-set=utf8mb4 -h <host> -u <user> -p <db> ^
--   -e "source DB/file_legacy_audit_query.sql"

SELECT
  file_id,
  file_path,
  origin_filename,
  rename_filename,
  delete_yn
FROM files
WHERE delete_yn = 'N'
  AND file_path IS NOT NULL
  AND file_path <> ''
ORDER BY file_id;

-- 2) Focus only potentially legacy rows
SELECT
  file_id,
  file_parent_type,
  file_parent_id,
  file_path,
  origin_filename,
  rename_filename,
  created_at
FROM files
WHERE delete_yn = 'N'
  AND (
    file_path LIKE '/%'
    OR file_path LIKE '%\\%'
    OR (
      file_path NOT LIKE '%/'
      AND SUBSTRING_INDEX(TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/')), '/', -1) LIKE '%.%'
    )
  )
ORDER BY file_id;
