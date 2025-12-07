-- ============================================================================
-- CEU THROTTLING & SUBSCRIPTION LIMITS
-- Two-tier model: Basic (no CEUs) vs Pro (CEU access with monthly limits)
-- Plus pay-per-unlock for users who need extra CEUs
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION TIER LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tier_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(20) NOT NULL UNIQUE, -- 'trial', 'basic', 'pro'

    -- CEU Access
    has_ceu_access BOOLEAN DEFAULT false,
    monthly_workshop_limit INTEGER, -- Number of workshops per month (2 for Pro)

    -- Description for UI
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tier limits - Simple two-tier model
INSERT INTO subscription_tier_limits (tier, has_ceu_access, monthly_workshop_limit, display_name, description)
VALUES
    ('basic', false, 0, 'Basic Plan', 'Access to wellness tools, Elya, and community - no CEU workshops'),
    ('pro', true, 2, 'Pro Plan', '$30/month - 2 CEU workshops per month')
ON CONFLICT (tier) DO UPDATE SET
    has_ceu_access = EXCLUDED.has_ceu_access,
    monthly_workshop_limit = EXCLUDED.monthly_workshop_limit,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- ============================================================================
-- 2. USER WORKSHOP USAGE TRACKING (Per Month)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_workshop_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Period tracking
    usage_month DATE NOT NULL, -- First day of the month (e.g., 2025-01-01)

    -- Usage metrics
    workshops_completed INTEGER DEFAULT 0,
    workshops_limit INTEGER NOT NULL, -- Snapshot of limit at start of month

    -- Extra purchases
    extra_workshops_purchased INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, usage_month)
);

CREATE INDEX idx_user_workshop_usage_user ON user_workshop_usage(user_id);
CREATE INDEX idx_user_workshop_usage_month ON user_workshop_usage(usage_month);

-- ============================================================================
-- 3. EXTRA WORKSHOP PURCHASES (Pay-per-unlock)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_extra_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Purchase details
    workshops_purchased INTEGER NOT NULL DEFAULT 1,
    price_paid_cents INTEGER NOT NULL, -- Amount paid in cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'refunded'

    -- When purchased
    purchased_at TIMESTAMPTZ DEFAULT NOW(),

    -- Which month this applies to
    applies_to_month DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ceu_extra_purchases_user ON ceu_extra_purchases(user_id);
CREATE INDEX idx_ceu_extra_purchases_month ON ceu_extra_purchases(applies_to_month);

-- ============================================================================
-- 4. MODULE ACCESS CONTROL FLAGS
-- ============================================================================

-- Add gated flag to ceu_modules if not exists
ALTER TABLE ceu_modules ADD COLUMN IF NOT EXISTS is_gated BOOLEAN DEFAULT true;

COMMENT ON COLUMN ceu_modules.is_gated IS 'If true, module counts against monthly workshop limit';

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Get or create current month usage record
CREATE OR REPLACE FUNCTION get_or_create_monthly_usage(p_user_id UUID)
RETURNS user_workshop_usage AS $$
DECLARE
    v_current_month DATE;
    v_usage user_workshop_usage;
    v_tier VARCHAR(20);
    v_limit INTEGER;
    v_extra INTEGER;
BEGIN
    -- Get first day of current month
    v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Try to get existing record
    SELECT * INTO v_usage
    FROM user_workshop_usage
    WHERE user_id = p_user_id AND usage_month = v_current_month;

    IF FOUND THEN
        RETURN v_usage;
    END IF;

    -- Get user's current tier and limit
    SELECT COALESCE(p.subscription_tier, 'basic'), COALESCE(stl.monthly_workshop_limit, 0)
    INTO v_tier, v_limit
    FROM profiles p
    LEFT JOIN subscription_tier_limits stl ON stl.tier = COALESCE(p.subscription_tier, 'basic')
    WHERE p.id = p_user_id;

    -- Check for extra purchases this month
    SELECT COALESCE(SUM(workshops_purchased), 0) INTO v_extra
    FROM ceu_extra_purchases
    WHERE user_id = p_user_id
    AND applies_to_month = v_current_month
    AND status = 'completed';

    -- Create new record
    INSERT INTO user_workshop_usage (
        user_id,
        usage_month,
        workshops_completed,
        workshops_limit,
        extra_workshops_purchased
    )
    VALUES (
        p_user_id,
        v_current_month,
        0,
        v_limit,
        v_extra
    )
    RETURNING * INTO v_usage;

    RETURN v_usage;
END;
$$ LANGUAGE plpgsql;

-- Check if user can access a CEU workshop
CREATE OR REPLACE FUNCTION can_access_workshop(p_user_id UUID, p_module_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier VARCHAR(20);
    v_has_ceu_access BOOLEAN;
    v_module RECORD;
    v_usage user_workshop_usage;
    v_workshops_available INTEGER;
BEGIN
    -- Get user's tier
    SELECT COALESCE(subscription_tier, 'basic') INTO v_tier
    FROM profiles WHERE id = p_user_id;

    -- Check if tier has CEU access
    SELECT has_ceu_access INTO v_has_ceu_access
    FROM subscription_tier_limits WHERE tier = v_tier;

    -- Get module info
    SELECT * INTO v_module
    FROM ceu_modules WHERE id = p_module_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'module_not_found');
    END IF;

    -- Basic tier has no CEU access at all
    IF NOT v_has_ceu_access AND v_tier = 'basic' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'no_ceu_access',
            'current_tier', v_tier,
            'message', 'Upgrade to Pro to access CEU workshops',
            'upgrade_required', true
        );
    END IF;

    -- Check monthly limits (for gated modules)
    IF v_module.is_gated THEN
        v_usage := get_or_create_monthly_usage(p_user_id);
        v_workshops_available := v_usage.workshops_limit + v_usage.extra_workshops_purchased - v_usage.workshops_completed;

        IF v_workshops_available <= 0 THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', 'monthly_limit_reached',
                'workshops_completed', v_usage.workshops_completed,
                'workshops_limit', v_usage.workshops_limit,
                'extra_purchased', v_usage.extra_workshops_purchased,
                'resets_on', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
                'can_purchase_extra', true,
                'message', 'You''ve used all your workshops this month. Purchase extra or wait for next month.'
            );
        END IF;
    END IF;

    -- All checks passed
    RETURN jsonb_build_object(
        'allowed', true,
        'workshops_remaining', v_workshops_available,
        'tier', v_tier
    );
END;
$$ LANGUAGE plpgsql;

-- Record workshop completion and update usage
CREATE OR REPLACE FUNCTION record_workshop_completion(p_user_id UUID, p_module_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_module RECORD;
    v_usage user_workshop_usage;
    v_access_check JSONB;
    v_workshops_remaining INTEGER;
BEGIN
    -- First check if user can access
    v_access_check := can_access_workshop(p_user_id, p_module_id);

    IF NOT (v_access_check->>'allowed')::boolean THEN
        RETURN v_access_check;
    END IF;

    -- Get module info
    SELECT * INTO v_module FROM ceu_modules WHERE id = p_module_id;

    -- Get/create usage record
    v_usage := get_or_create_monthly_usage(p_user_id);

    -- Update usage if module is gated
    IF v_module.is_gated THEN
        UPDATE user_workshop_usage
        SET
            workshops_completed = workshops_completed + 1,
            updated_at = NOW()
        WHERE id = v_usage.id
        RETURNING * INTO v_usage;
    END IF;

    v_workshops_remaining := v_usage.workshops_limit + v_usage.extra_workshops_purchased - v_usage.workshops_completed;

    RETURN jsonb_build_object(
        'success', true,
        'ceu_value', v_module.ceu_value,
        'workshops_completed_this_month', v_usage.workshops_completed,
        'workshops_remaining', v_workshops_remaining
    );
END;
$$ LANGUAGE plpgsql;

-- Purchase extra workshops
CREATE OR REPLACE FUNCTION purchase_extra_workshops(
    p_user_id UUID,
    p_quantity INTEGER,
    p_price_cents INTEGER,
    p_stripe_payment_intent_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_current_month DATE;
    v_purchase_id UUID;
BEGIN
    v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Create purchase record
    INSERT INTO ceu_extra_purchases (
        user_id,
        workshops_purchased,
        price_paid_cents,
        stripe_payment_intent_id,
        applies_to_month,
        status
    )
    VALUES (
        p_user_id,
        p_quantity,
        p_price_cents,
        p_stripe_payment_intent_id,
        v_current_month,
        'completed'
    )
    RETURNING id INTO v_purchase_id;

    -- Update current month's usage record
    UPDATE user_workshop_usage
    SET
        extra_workshops_purchased = extra_workshops_purchased + p_quantity,
        updated_at = NOW()
    WHERE user_id = p_user_id AND usage_month = v_current_month;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'workshops_added', p_quantity,
        'applies_to_month', v_current_month
    );
END;
$$ LANGUAGE plpgsql;

-- Get user's current CEU/workshop status
CREATE OR REPLACE FUNCTION get_user_workshop_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier VARCHAR(20);
    v_tier_info RECORD;
    v_usage user_workshop_usage;
    v_cycle_summary RECORD;
    v_workshops_remaining INTEGER;
    v_days_until_reset INTEGER;
BEGIN
    -- Get user's tier
    SELECT COALESCE(subscription_tier, 'basic') INTO v_tier
    FROM profiles WHERE id = p_user_id;

    -- Get tier info
    SELECT * INTO v_tier_info
    FROM subscription_tier_limits WHERE tier = v_tier;

    -- Get current month usage
    v_usage := get_or_create_monthly_usage(p_user_id);

    v_workshops_remaining := v_usage.workshops_limit + v_usage.extra_workshops_purchased - v_usage.workshops_completed;
    v_days_until_reset := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE - CURRENT_DATE;

    -- Get cycle summary from user_ceu_summary
    SELECT
        professional_studies_earned,
        ppo_earned,
        total_earned,
        total_required,
        is_compliant,
        cycle_start_date,
        cycle_end_date
    INTO v_cycle_summary
    FROM user_ceu_summary
    WHERE user_id = p_user_id
    ORDER BY cycle_start_date DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'tier', v_tier,
        'tier_display_name', v_tier_info.display_name,
        'has_ceu_access', v_tier_info.has_ceu_access,

        -- Monthly status
        'monthly', jsonb_build_object(
            'workshops_limit', v_usage.workshops_limit,
            'workshops_completed', v_usage.workshops_completed,
            'extra_purchased', v_usage.extra_workshops_purchased,
            'workshops_remaining', v_workshops_remaining,
            'resets_on', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
            'days_until_reset', v_days_until_reset,
            'can_purchase_extra', v_workshops_remaining <= 0
        ),

        -- RID Cycle progress
        'cycle', jsonb_build_object(
            'start_date', v_cycle_summary.cycle_start_date,
            'end_date', v_cycle_summary.cycle_end_date,
            'total_earned', COALESCE(v_cycle_summary.total_earned, 0),
            'total_required', COALESCE(v_cycle_summary.total_required, 8.0),
            'ps_earned', COALESCE(v_cycle_summary.professional_studies_earned, 0),
            'ppo_earned', COALESCE(v_cycle_summary.ppo_earned, 0),
            'is_compliant', COALESCE(v_cycle_summary.is_compliant, false)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE subscription_tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workshop_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_extra_purchases ENABLE ROW LEVEL SECURITY;

-- Tier limits are publicly readable
CREATE POLICY "Tier limits are viewable by all" ON subscription_tier_limits
    FOR SELECT TO authenticated
    USING (true);

-- Users can only see their own usage
CREATE POLICY "Users can view own workshop usage" ON user_workshop_usage
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own workshop usage" ON user_workshop_usage
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can see their own purchases
CREATE POLICY "Users can view own purchases" ON ceu_extra_purchases
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- 7. TRIGGER: Update usage when workshop is completed
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workshop_usage_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_module RECORD;
    v_current_month DATE;
BEGIN
    -- Only trigger on completion
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        SELECT * INTO v_module FROM ceu_modules WHERE id = NEW.module_id;

        IF FOUND AND v_module.is_gated THEN
            v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

            -- Update or create monthly usage
            INSERT INTO user_workshop_usage (
                user_id,
                usage_month,
                workshops_completed,
                workshops_limit,
                extra_workshops_purchased
            )
            SELECT
                NEW.interpreter_id,
                v_current_month,
                1,
                COALESCE(stl.monthly_workshop_limit, 0),
                0
            FROM profiles p
            LEFT JOIN subscription_tier_limits stl ON stl.tier = COALESCE(p.subscription_tier, 'basic')
            WHERE p.id = NEW.interpreter_id
            ON CONFLICT (user_id, usage_month) DO UPDATE SET
                workshops_completed = user_workshop_usage.workshops_completed + 1,
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workshop_usage ON interpreter_module_progress;
CREATE TRIGGER trigger_update_workshop_usage
    AFTER INSERT OR UPDATE ON interpreter_module_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_workshop_usage_on_completion();

-- ============================================================================
-- 8. PRICING CONFIG FOR EXTRA WORKSHOPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_extra_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity INTEGER NOT NULL UNIQUE, -- Number of workshops
    price_cents INTEGER NOT NULL, -- Price in cents
    stripe_price_id TEXT, -- Stripe Price ID for checkout
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pricing (adjust as needed)
INSERT INTO ceu_extra_pricing (quantity, price_cents)
VALUES
    (1, 999),   -- $9.99 for 1 extra workshop
    (3, 2499),  -- $24.99 for 3 extra workshops (save ~$5)
    (5, 3999)   -- $39.99 for 5 extra workshops (save ~$10)
ON CONFLICT (quantity) DO UPDATE SET
    price_cents = EXCLUDED.price_cents;

ALTER TABLE ceu_extra_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extra pricing is viewable by all" ON ceu_extra_pricing
    FOR SELECT TO authenticated
    USING (is_active = true);

-- ============================================================================
-- 9. FEATURE LIMITS BY TIER (Non-CEU throttling)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tier_feature_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(20) NOT NULL UNIQUE,

    -- Elya AI Coach
    elya_conversations_per_month INTEGER, -- NULL = unlimited

    -- Wellness
    wellness_checkins_per_month INTEGER, -- NULL = unlimited

    -- ECCI Reflections
    saved_reflections_max INTEGER, -- Max saved (older ones auto-archive), NULL = unlimited
    reflection_history_days INTEGER, -- How far back they can see, NULL = unlimited

    -- Skills modules (non-CEU micro-learning)
    skills_modules_per_month INTEGER, -- NULL = unlimited

    -- Community
    community_access VARCHAR(20) DEFAULT 'full', -- 'none', 'read_only', 'full'
    can_post_community BOOLEAN DEFAULT true,
    can_dm_community BOOLEAN DEFAULT true,

    -- Drills
    drills_per_month INTEGER, -- NULL = unlimited

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed feature limits
INSERT INTO tier_feature_limits (
    tier,
    elya_conversations_per_month,
    wellness_checkins_per_month,
    saved_reflections_max,
    reflection_history_days,
    skills_modules_per_month,
    community_access,
    can_post_community,
    can_dm_community,
    drills_per_month
)
VALUES
    (
        'basic',
        5,      -- 5 Elya conversations/month
        3,      -- 3 wellness check-ins/month
        3,      -- Max 3 saved reflections (oldest auto-archives)
        7,      -- Can see last 7 days of history
        1,      -- 1 skills module/month
        'read_only', -- Can read community, not post
        false,
        false,
        3       -- 3 drills/month
    ),
    (
        'pro',
        NULL,   -- Unlimited Elya
        NULL,   -- Unlimited wellness
        NULL,   -- Unlimited saved reflections
        NULL,   -- Full history
        NULL,   -- Unlimited skills modules
        'full', -- Full community access
        true,
        true,
        NULL    -- Unlimited drills
    )
ON CONFLICT (tier) DO UPDATE SET
    elya_conversations_per_month = EXCLUDED.elya_conversations_per_month,
    wellness_checkins_per_month = EXCLUDED.wellness_checkins_per_month,
    saved_reflections_max = EXCLUDED.saved_reflections_max,
    reflection_history_days = EXCLUDED.reflection_history_days,
    skills_modules_per_month = EXCLUDED.skills_modules_per_month,
    community_access = EXCLUDED.community_access,
    can_post_community = EXCLUDED.can_post_community,
    can_dm_community = EXCLUDED.can_dm_community,
    drills_per_month = EXCLUDED.drills_per_month;

ALTER TABLE tier_feature_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature limits are viewable by all" ON tier_feature_limits
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- 10. USER FEATURE USAGE TRACKING (Per Month)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_month DATE NOT NULL, -- First day of month

    -- Usage counts
    elya_conversations_used INTEGER DEFAULT 0,
    wellness_checkins_used INTEGER DEFAULT 0,
    skills_modules_used INTEGER DEFAULT 0,
    drills_used INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, usage_month)
);

CREATE INDEX idx_user_feature_usage_user ON user_feature_usage(user_id);
CREATE INDEX idx_user_feature_usage_month ON user_feature_usage(usage_month);

ALTER TABLE user_feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature usage" ON user_feature_usage
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own feature usage" ON user_feature_usage
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 11. FEATURE ACCESS CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION can_use_feature(p_user_id UUID, p_feature VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_tier VARCHAR(20);
    v_limits RECORD;
    v_usage RECORD;
    v_current_month DATE;
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Get user's tier
    SELECT COALESCE(subscription_tier, 'basic') INTO v_tier
    FROM profiles WHERE id = p_user_id;

    -- Get tier limits
    SELECT * INTO v_limits
    FROM tier_feature_limits WHERE tier = v_tier;

    -- Get or create usage record
    INSERT INTO user_feature_usage (user_id, usage_month)
    VALUES (p_user_id, v_current_month)
    ON CONFLICT (user_id, usage_month) DO NOTHING;

    SELECT * INTO v_usage
    FROM user_feature_usage
    WHERE user_id = p_user_id AND usage_month = v_current_month;

    -- Check specific feature
    CASE p_feature
        WHEN 'elya' THEN
            v_limit := v_limits.elya_conversations_per_month;
            v_used := v_usage.elya_conversations_used;
        WHEN 'wellness' THEN
            v_limit := v_limits.wellness_checkins_per_month;
            v_used := v_usage.wellness_checkins_used;
        WHEN 'skills' THEN
            v_limit := v_limits.skills_modules_per_month;
            v_used := v_usage.skills_modules_used;
        WHEN 'drills' THEN
            v_limit := v_limits.drills_per_month;
            v_used := v_usage.drills_used;
        WHEN 'community_post' THEN
            RETURN jsonb_build_object(
                'allowed', v_limits.can_post_community,
                'reason', CASE WHEN v_limits.can_post_community THEN NULL ELSE 'upgrade_required' END,
                'tier', v_tier
            );
        WHEN 'community_dm' THEN
            RETURN jsonb_build_object(
                'allowed', v_limits.can_dm_community,
                'reason', CASE WHEN v_limits.can_dm_community THEN NULL ELSE 'upgrade_required' END,
                'tier', v_tier
            );
        ELSE
            RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
    END CASE;

    -- NULL limit means unlimited
    IF v_limit IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'unlimited', true,
            'tier', v_tier
        );
    END IF;

    -- Check if under limit
    IF v_used < v_limit THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'used', v_used,
            'limit', v_limit,
            'remaining', v_limit - v_used,
            'tier', v_tier
        );
    ELSE
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'monthly_limit_reached',
            'used', v_used,
            'limit', v_limit,
            'resets_on', (v_current_month + INTERVAL '1 month')::DATE,
            'upgrade_required', true,
            'tier', v_tier
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(p_user_id UUID, p_feature VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_current_month DATE;
    v_check JSONB;
BEGIN
    -- First check if allowed
    v_check := can_use_feature(p_user_id, p_feature);

    IF NOT (v_check->>'allowed')::boolean THEN
        RETURN v_check;
    END IF;

    v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Increment usage
    CASE p_feature
        WHEN 'elya' THEN
            UPDATE user_feature_usage
            SET elya_conversations_used = elya_conversations_used + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND usage_month = v_current_month;
        WHEN 'wellness' THEN
            UPDATE user_feature_usage
            SET wellness_checkins_used = wellness_checkins_used + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND usage_month = v_current_month;
        WHEN 'skills' THEN
            UPDATE user_feature_usage
            SET skills_modules_used = skills_modules_used + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND usage_month = v_current_month;
        WHEN 'drills' THEN
            UPDATE user_feature_usage
            SET drills_used = drills_used + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND usage_month = v_current_month;
        ELSE
            NULL; -- No tracking needed for this feature
    END CASE;

    -- Return updated check
    RETURN can_use_feature(p_user_id, p_feature);
END;
$$ LANGUAGE plpgsql;

-- Get full user limits status (for dashboard)
CREATE OR REPLACE FUNCTION get_user_feature_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tier VARCHAR(20);
    v_limits RECORD;
    v_usage RECORD;
    v_current_month DATE;
BEGIN
    v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- Get user's tier
    SELECT COALESCE(subscription_tier, 'basic') INTO v_tier
    FROM profiles WHERE id = p_user_id;

    -- Get tier limits
    SELECT * INTO v_limits
    FROM tier_feature_limits WHERE tier = v_tier;

    -- Get or create usage
    INSERT INTO user_feature_usage (user_id, usage_month)
    VALUES (p_user_id, v_current_month)
    ON CONFLICT (user_id, usage_month) DO NOTHING;

    SELECT * INTO v_usage
    FROM user_feature_usage
    WHERE user_id = p_user_id AND usage_month = v_current_month;

    RETURN jsonb_build_object(
        'tier', v_tier,
        'resets_on', (v_current_month + INTERVAL '1 month')::DATE,

        'elya', jsonb_build_object(
            'used', v_usage.elya_conversations_used,
            'limit', v_limits.elya_conversations_per_month,
            'unlimited', v_limits.elya_conversations_per_month IS NULL
        ),

        'wellness', jsonb_build_object(
            'used', v_usage.wellness_checkins_used,
            'limit', v_limits.wellness_checkins_per_month,
            'unlimited', v_limits.wellness_checkins_per_month IS NULL
        ),

        'reflections', jsonb_build_object(
            'max_saved', v_limits.saved_reflections_max,
            'history_days', v_limits.reflection_history_days,
            'unlimited', v_limits.saved_reflections_max IS NULL
        ),

        'skills', jsonb_build_object(
            'used', v_usage.skills_modules_used,
            'limit', v_limits.skills_modules_per_month,
            'unlimited', v_limits.skills_modules_per_month IS NULL
        ),

        'drills', jsonb_build_object(
            'used', v_usage.drills_used,
            'limit', v_limits.drills_per_month,
            'unlimited', v_limits.drills_per_month IS NULL
        ),

        'community', jsonb_build_object(
            'access', v_limits.community_access,
            'can_post', v_limits.can_post_community,
            'can_dm', v_limits.can_dm_community
        )
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE subscription_tier_limits IS 'Two-tier model: Basic (Free) vs Pro ($30/mo, 2 workshops/month)';
COMMENT ON TABLE user_workshop_usage IS 'Tracks monthly CEU workshop usage per user';
COMMENT ON TABLE ceu_extra_purchases IS 'Records when users purchase extra workshops beyond their monthly limit';
COMMENT ON TABLE ceu_extra_pricing IS 'Pricing for purchasing extra workshops ($9.99/1, $24.99/3, $39.99/5)';
COMMENT ON TABLE tier_feature_limits IS 'Feature limits per tier (Elya, wellness, reflections, skills, community, drills)';
COMMENT ON TABLE user_feature_usage IS 'Tracks monthly feature usage per user for throttling';
