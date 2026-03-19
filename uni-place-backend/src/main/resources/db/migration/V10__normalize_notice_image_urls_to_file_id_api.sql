UPDATE notice n
JOIN files f
  ON f.file_parent_type = 'NOTICE'
 AND f.file_parent_id = n.notice_id
 AND f.delete_yn = 'N'
SET n.notice_ctnt = REGEXP_REPLACE(
    n.notice_ctnt,
    CONCAT(
      'https?://[^\"'' >]+/',
      REPLACE(CONCAT(f.file_path, '/', f.rename_filename), '.', '\\.')
    ),
    CONCAT('/api/files/', f.file_id, '/view')
)
WHERE n.notice_ctnt IS NOT NULL
  AND n.notice_ctnt <> ''
  AND n.notice_ctnt LIKE CONCAT('%', f.file_path, '/', f.rename_filename, '%');
