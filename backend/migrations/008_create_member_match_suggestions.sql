-- +goose Up
CREATE TABLE member_match_suggestions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    confidence  INT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, member_id)
);

CREATE INDEX idx_match_suggestions_user_id ON member_match_suggestions(user_id);
CREATE INDEX idx_match_suggestions_member_id ON member_match_suggestions(member_id);
CREATE INDEX idx_match_suggestions_status ON member_match_suggestions(status);

-- +goose Down
DROP TABLE IF EXISTS member_match_suggestions;
