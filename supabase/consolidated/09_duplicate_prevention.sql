-- 1. Define the Cleanup Function
CREATE OR REPLACE FUNCTION delete_duplicates(target_table text, group_by_columns text[])
RETURNS integer AS $$
DECLARE
    deleted_count integer;
    sql_query text;
BEGIN
    sql_query := format(
        'WITH duplicates AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY %s ORDER BY updated_at DESC, created_at DESC) as row_num
            FROM %I
        )
        DELETE FROM %I
        WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1)',
        array_to_string(group_by_columns, ', '),
        target_table,
        target_table
    );
    
    EXECUTE sql_query;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Immediate Cleanup (CRITICAL: removing status from the group-by so we merge Active/Downloaded rows)
SELECT delete_duplicates('quotes', ARRAY['user_id', 'investor_email', 'property_address', 'loan_amount']);
SELECT delete_duplicates('investors', ARRAY['user_id', 'email']);

-- 3. Create strict Unique Indexes (No status allowed in the index)
DROP INDEX IF EXISTS unique_quote_idx;
CREATE UNIQUE INDEX unique_quote_idx 
ON public.quotes (
    user_id, 
    investor_email, 
    property_address, 
    loan_amount
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_investor_idx 
ON public.investors (user_id, email);

-- 4. Registry for Dev Dashboard cleanup button
CREATE OR REPLACE FUNCTION delete_duplicates_v2()
RETURNS integer AS $$
BEGIN
    -- This version is now more aggressive, merging deals regardless of status
    RETURN delete_duplicates('quotes', ARRAY['user_id', 'investor_email', 'property_address', 'loan_amount']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

