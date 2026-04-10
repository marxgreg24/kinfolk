-- +goose Up
-- +goose StatementBegin
DO $migration$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'relationships'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%relationship_type%'
    LOOP
        EXECUTE format('ALTER TABLE relationships DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $migration$;
-- +goose StatementEnd

ALTER TABLE relationships
    ADD CONSTRAINT relationships_relationship_type_check
    CHECK (relationship_type IN (
        'child', 'parent', 'spouse', 'sibling',
        'uncle', 'aunt', 'cousin', 'second_cousin',
        'grandparent', 'grandchild', 'nephew', 'niece',
        'in_law', 'step_parent', 'step_child', 'half_sibling',
        'co_wife'
    ));

-- +goose Down
ALTER TABLE relationships
    DROP CONSTRAINT IF EXISTS relationships_relationship_type_check;

ALTER TABLE relationships
    ADD CONSTRAINT relationships_relationship_type_check
    CHECK (relationship_type IN (
        'child', 'parent', 'spouse', 'sibling',
        'uncle', 'aunt', 'cousin', 'second_cousin',
        'grandparent', 'grandchild', 'nephew', 'niece',
        'in_law', 'step_parent', 'step_child', 'half_sibling'
    ));
