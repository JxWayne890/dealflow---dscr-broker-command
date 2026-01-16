-- Seed the "Cold Lead Revival" Campaign
do $$
declare
  v_campaign_id uuid;
  v_user_id uuid;
begin
  -- Attempt to get the first user to assign the campaign to (optional, nullable in schema)
  select id into v_user_id from auth.users limit 1;

  -- 1. Create the Campaign
  INSERT INTO public.campaigns (name, description, is_active, user_id)
  VALUES (
    'Cold Lead Revival', 
    'A 3-step sequence designed to re-engage investors who have gone quiet. Starts 3 days after the initial quote.', 
    true, 
    v_user_id
  )
  RETURNING id INTO v_campaign_id;

  -- (Removed original Step 1 - Immediate Value)

  -- 2. Create New Step 1: Short Bump (Formerly Step 2 - Day 3)
  INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
  VALUES (
    v_campaign_id,
    1,
    3, -- 3 days delay from enrollment
    'Re: Funding for {{address}}',
    'Hi {{firstName}},

Just floating this to the top of your inbox to see if you had any thoughts on the note below?

Markets are moving fast and I''d love to lock in a rate for you before the end of the week if you''re ready to move forward.

Thanks,
DealFlow Team'
  );

  -- 3. Create New Step 2: Social Proof (Formerly Step 3 - +4 days)
  INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
  VALUES (
    v_campaign_id,
    2,
    4, -- 4 days delay from previous
    'Just closed a similar deal',
    '{{firstName}},

I just wanted to share a quick win—we just closed a DSCR loan for another investor on a property very similar to yours.

The breakdown:
* 75% LTV
* Closed in 19 days
* Cash-out for their next rehab

I know every deal is different, but I''m confident we can structure something similar for {{address}}. Are you still looking for funding?

Best,
DealFlow Team'
  );

  -- 4. Create New Step 3: The Break-up (Formerly Step 4 - +7 days)
  INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
  VALUES (
    v_campaign_id,
    3,
    7, -- 7 days delay from previous
    'Closing your file?',
    'Hi {{firstName}},

I haven''t heard back, so I assume this property isn''t a priority right now or you''ve found funding elsewhere.

I''m going to archive your file for now so I don''t keep pestering you.

If you ever need a quick DSCR quote in the future, just hit reply and I''ll take care of you.

Take care,
DealFlow Team'
  );

end;
$$;
