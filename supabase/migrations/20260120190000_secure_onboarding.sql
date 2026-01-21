-- Function to secure update profile during onboarding without active session
CREATE OR REPLACE FUNCTION update_onboarding_profile(
    p_user_id UUID,
    p_name TEXT,
    p_company TEXT,
    p_title TEXT,
    p_phone TEXT,
    p_website TEXT,
    p_role TEXT,
    p_onboarding_status TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        name = COALESCE(p_name, name),
        company = COALESCE(p_company, company),
        title = COALESCE(p_title, title),
        phone = COALESCE(p_phone, phone),
        website = COALESCE(p_website, website),
        role = COALESCE(p_role, role),
        onboarding_status = COALESCE(p_onboarding_status, onboarding_status)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
