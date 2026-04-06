-- +goose Up
CREATE TABLE clan_member_interests (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id    UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    full_name  TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('pending', 'archived')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clan_member_interests_clan_id ON clan_member_interests(clan_id);
CREATE INDEX idx_clan_member_interests_status  ON clan_member_interests(status);
-- Prevent the same email from submitting interest to the same clan twice
CREATE UNIQUE INDEX idx_clan_member_interests_clan_email ON clan_member_interests(clan_id, LOWER(email));

-- +goose Down
DROP TABLE IF EXISTS clan_member_interests;
