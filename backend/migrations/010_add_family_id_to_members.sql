-- +goose Up
ALTER TABLE members
    ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE SET NULL;

CREATE INDEX idx_members_family_id ON members(family_id);

-- +goose Down
ALTER TABLE members DROP COLUMN IF EXISTS family_id;
