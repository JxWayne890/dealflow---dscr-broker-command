-- Keep a single subscription row per campaign + lead pair and enforce it going forward.
WITH ranked_subscriptions AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY campaign_id, lead_id
            ORDER BY
                CASE status
                    WHEN 'active' THEN 0
                    WHEN 'paused' THEN 1
                    WHEN 'completed' THEN 2
                    ELSE 3
                END,
                current_step_index DESC,
                COALESCE(last_email_sent_at, created_at) DESC,
                created_at DESC,
                id DESC
        ) AS row_num
    FROM public.campaign_subscriptions
)
DELETE FROM public.campaign_subscriptions
WHERE id IN (
    SELECT id
    FROM ranked_subscriptions
    WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_campaign_subscription_idx
ON public.campaign_subscriptions (campaign_id, lead_id);
