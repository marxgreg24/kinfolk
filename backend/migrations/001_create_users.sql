-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id           TEXT UNIQUE NOT NULL,
    full_name               TEXT NOT NULL,
    email                   TEXT UNIQUE NOT NULL,
    phone                   TEXT,
    birth_year              INT,
    gender                  TEXT CHECK (gender IN ('male', 'female')),
    profile_picture_url     TEXT,
    role                    TEXT NOT NULL CHECK (role IN ('general_user', 'clan_leader', 'admin')),
    clan_id                 UUID,
    is_suspended            BOOLEAN NOT NULL DEFAULT FALSE,
    password_reset_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_clan_id ON users(clan_id);

-- +goose Down
DROP TABLE IF EXISTS users;
