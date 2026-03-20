-- Normalize legacy file_path values that can be safely corrected in DB only.
-- Scope:
-- 1) trim whitespace
-- 2) convert backslashes to slashes
-- 3) remove leading slashes
-- 4) when file_path ends with rename_filename, keep directory only (trailing slash)

UPDATE files
SET file_path = TRIM(file_path)
WHERE file_path <> TRIM(file_path);

UPDATE files
SET file_path = REPLACE(file_path, '\\', '/')
WHERE file_path LIKE '%\\%';

UPDATE files
SET file_path = TRIM(LEADING '/' FROM file_path)
WHERE file_path LIKE '/%';

UPDATE files
SET file_path = CONCAT(
    SUBSTRING(
      TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/')),
      1,
      CHAR_LENGTH(TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/')))
      - CHAR_LENGTH(SUBSTRING_INDEX(TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/')), '/', -1))
      - 1
    ),
    '/'
)
WHERE delete_yn = 'N'
  AND LOCATE('/', TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/'))) > 0
  AND SUBSTRING_INDEX(TRIM(LEADING '/' FROM REPLACE(TRIM(file_path), '\\', '/')), '/', -1) = rename_filename;
