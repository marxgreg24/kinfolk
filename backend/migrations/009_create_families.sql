-- +goose Up
CREATE TABLE families (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id     UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_clan_id ON families(clan_id);
CREATE UNIQUE INDEX idx_families_clan_name ON families(clan_id, LOWER(name));

-- +goose Down
DROP TABLE IF EXISTS families;
