-- Secure function to access a specific quote for public links (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_public_quote(lookup_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT to_jsonb(q) INTO result
    FROM public.quotes q
    WHERE q.id = lookup_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_quote(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_quote(uuid) TO authenticated;
