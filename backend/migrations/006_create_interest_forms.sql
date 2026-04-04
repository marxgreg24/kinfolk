-- +goose Up
CREATE TABLE interest_forms (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name        TEXT NOT NULL,
    clan_name        TEXT NOT NULL,
    email            TEXT NOT NULL,
    phone            TEXT NOT NULL,
    region           TEXT,
    expected_members INT,
    message          TEXT,
    status           TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interest_forms_status ON interest_forms(status);
CREATE INDEX idx_interest_forms_email ON interest_forms(email);

-- +goose Down
DROP TABLE IF EXISTS interest_forms;
