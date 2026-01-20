-- Seed the "Cold Lead Revival" Campaign
do $$
declare
  v_campaign_id uuid;
  v_user_id uuid;
begin
  -- 1. Get current organization (admin context)
  select id into v_user_id from auth.users limit 1;

  -- 2. Create the Campaign
  INSERT INTO public.campaigns (name, description, is_active, user_id)
  VALUES (
    'Cold Lead Revival', 
    'A 3-step sequence designed to re-engage investors who have gone quiet. Starts 3 days after the initial quote.', 
    true, 
    v_user_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_campaign_id;

  IF v_campaign_id IS NOT NULL THEN
    -- 3. Step 1: Short Bump
    INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
    VALUES (
      v_campaign_id,
      1,
      3,
      'Re: Funding for {{address}}',
      'Hi {{firstName}},\n\nJust floating this to the top of your inbox to see if you had any thoughts on the note below?\n\nMarkets are moving fast and I''d love to lock in a rate for you before the end of the week if you''re ready to move forward.\n\nThanks,\nDealFlow Team'
    );

    -- 4. Step 2: Social Proof
    INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
    VALUES (
      v_campaign_id,
      2,
      4,
      'Just closed a similar deal',
      '{{firstName}},\n\nI just wanted to share a quick win—we just closed a DSCR loan for another investor on a property very similar to yours.\n\nThe breakdown:\n* 75% LTV\n* Closed in 19 days\n* Cash-out for their next rehab\n\nI know every deal is different, but I''m confident we can structure something similar for {{address}}. Are you still looking for funding?\n\nBest,\nDealFlow Team'
    );

    -- 5. Step 3: The Break-up
    INSERT INTO public.campaign_steps (campaign_id, order_index, delay_days, subject_template, body_template)
    VALUES (
      v_campaign_id,
      3,
      7,
      'Closing your file?',
      'Hi {{firstName}},\n\nI haven''t heard back, so I assume this property isn''t a priority right now or you''ve found funding elsewhere.\n\nI''m going to archive your file for now so I don''t keep pestering you.\n\nIf you ever need a quick DSCR quote in the future, just hit reply and I''ll take care of you.\n\nTake care,\nDealFlow Team'
    );
  END IF;

end;
$$;
