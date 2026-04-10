-- +goose Up
ALTER TABLE relationships
    DROP CONSTRAINT IF EXISTS relationships_relationship_type_check;

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
