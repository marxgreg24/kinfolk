-- +goose Up
CREATE TABLE clans (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT UNIQUE NOT NULL,
    leader_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clans_leader_id ON clans(leader_id);
CREATE INDEX idx_clans_name ON clans(name);

ALTER TABLE users
    ADD CONSTRAINT fk_users_clan_id
    FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_clan_id;
DROP TABLE IF EXISTS clans;
