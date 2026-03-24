ALTER TABLE files
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER updated_at;

ALTER TABLE files
    ADD INDEX ix_files_sort (file_parent_type, file_parent_id, sort_order);