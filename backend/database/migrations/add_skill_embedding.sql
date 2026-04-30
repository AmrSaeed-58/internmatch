-- Adds the name_embedding column used for semantic skill dedup at insert time.
-- Idempotent: safe to run on a database that already has the column.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'skill'
    AND COLUMN_NAME = 'name_embedding'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE `skill` ADD COLUMN `name_embedding` JSON NULL AFTER `category`',
  'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
