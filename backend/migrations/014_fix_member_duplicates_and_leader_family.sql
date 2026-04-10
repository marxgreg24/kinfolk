-- +goose Up

-- 1. Remove duplicate member rows that share the same (clan_id, email).
--    Keep the canonical record: prefer the row that already has a linked
--    user account (user_id IS NOT NULL), breaking ties by most-recently
--    created.
DELETE FROM members
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY clan_id, LOWER(email)
                ORDER BY (user_id IS NOT NULL) DESC, created_at DESC
            ) AS rn
        FROM members
        WHERE email IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- 2. Prevent future duplicates: enforce one member record per email
--    within a clan.
CREATE UNIQUE INDEX idx_members_clan_email
    ON members (clan_id, LOWER(email))
    WHERE email IS NOT NULL;

-- 3. Assign clan leaders to the earliest family in their clan when their
--    member record exists but has no family assigned yet.
UPDATE members AS m
SET    family_id  = (
           SELECT f.id
           FROM   families f
           WHERE  f.clan_id = m.clan_id
           ORDER  BY f.created_at ASC
           LIMIT  1
       ),
       updated_at = NOW()
WHERE  m.family_id IS NULL
  AND  m.user_id IN (
           SELECT c.leader_id
           FROM   clans c
           WHERE  c.id = m.clan_id
       );

-- +goose Down
DROP INDEX IF EXISTS idx_members_clan_email;