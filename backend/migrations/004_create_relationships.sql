-- +goose Up
CREATE TABLE relationships (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id           UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    from_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_member_id      UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
                          'child', 'parent', 'spouse', 'sibling',
                          'uncle', 'aunt', 'cousin', 'second_cousin',
                          'grandparent', 'grandchild', 'nephew', 'niece',
                          'in_law', 'step_parent', 'step_child', 'half_sibling'
                      )),
    is_inferred       BOOLEAN NOT NULL DEFAULT FALSE,
    status            TEXT NOT NULL CHECK (status IN ('active', 'pending', 'conflicted')) DEFAULT 'pending',
    submitted_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relationships_clan_id ON relationships(clan_id);
CREATE INDEX idx_relationships_from_user_id ON relationships(from_user_id);
CREATE INDEX idx_relationships_to_member_id ON relationships(to_member_id);
CREATE INDEX idx_relationships_status ON relationships(status);

-- +goose Down
DROP TABLE IF EXISTS relationships;
