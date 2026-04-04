-- +goose Up
CREATE TABLE members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id             UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    email               TEXT,
    profile_picture_url TEXT,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_clan_id ON members(clan_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_email ON members(email);

-- +goose Down
DROP TABLE IF EXISTS members;
