-- Free Trial Email Tracking
-- Adds email count and subscription status to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Create function to increment email count
CREATE OR REPLACE FUNCTION increment_email_count(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET emails_sent = COALESCE(emails_sent, 0) + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
