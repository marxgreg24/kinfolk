-- +goose Up
CREATE TABLE conflicts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id                     UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    original_relationship_id    UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    conflicting_relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    resolved_by                 UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution                  TEXT CHECK (resolution IN ('approve_original', 'approve_conflicting', 'reject_both')),
    resolved_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conflicts_clan_id ON conflicts(clan_id);
CREATE INDEX idx_conflicts_original_relationship_id ON conflicts(original_relationship_id);
CREATE INDEX idx_conflicts_conflicting_relationship_id ON conflicts(conflicting_relationship_id);

-- +goose Down
DROP TABLE IF EXISTS conflicts;
