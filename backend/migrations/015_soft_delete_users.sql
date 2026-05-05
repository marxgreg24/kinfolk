-- +goose Up
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_users_deleted_at;
ALTER TABLE users DROP COLUMN deleted_at;
