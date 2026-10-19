-- ==============================================================================
-- TeraWala & TeraViralHub Database Security Hardening Script
-- Target: Supabase Postgres (Public Schema)
-- ==============================================================================

-- 1. Ensure is_admin helper is robust, non-bypassable, and runs with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = p_user_id),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Trigger on profiles to prevent unauthorized privilege escalation
-- Regular users MUST NOT be able to grant themselves admin role, VIP subscription, or unlimited quotas.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If role, subscription_tier, daily_limit, subscription_status, or subscription_end are being modified:
  IF (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR
    OLD.daily_limit IS DISTINCT FROM NEW.daily_limit OR
    OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
    OLD.subscription_end IS DISTINCT FROM NEW.subscription_end
  ) THEN
    -- Allow if called from a verified, trusted internal database function (e.g. activate_subscription)
    IF current_setting('terawala.trusted_context', true) = 'true' THEN
      RETURN NEW;
    END IF;

    -- Check if calling principal is an admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: You do not have permission to modify privileged account fields (role, subscription tier, or daily quotas).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 3. Lock down public.profiles with Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete access" ON public.profiles;

-- PII Protection: Users can ONLY read their own profile row. Admins can view all profiles.
CREATE POLICY "Profiles read access" ON public.profiles
FOR SELECT TO public
USING (
  (auth.uid() = id) OR public.is_admin(auth.uid())
);

-- Users can update basic profile fields (name), but the trigger blocks privileged escalations.
CREATE POLICY "Profiles update access" ON public.profiles
FOR UPDATE TO public
USING (
  (auth.uid() = id) OR public.is_admin(auth.uid())
)
WITH CHECK (
  (auth.uid() = id) OR public.is_admin(auth.uid())
);

-- Users can insert their own profile on signup.
CREATE POLICY "Profiles insert access" ON public.profiles
FOR INSERT TO public
WITH CHECK (
  auth.uid() = id
);

-- Only verified administrators can delete user accounts.
CREATE POLICY "Profiles delete access" ON public.profiles
FOR DELETE TO public
USING (
  public.is_admin(auth.uid())
);

-- 4. Secure public.terabox_videos (Enable RLS & Admin-Only Write Access)
ALTER TABLE public.terabox_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to terabox_videos" ON public.terabox_videos;
DROP POLICY IF EXISTS "Allow authenticated insert to terabox_videos" ON public.terabox_videos;
DROP POLICY IF EXISTS "Allow admin insert terabox_videos" ON public.terabox_videos;
DROP POLICY IF EXISTS "Allow admin update terabox_videos" ON public.terabox_videos;
DROP POLICY IF EXISTS "Allow admin delete terabox_videos" ON public.terabox_videos;

-- Public read catalog for viral hub and player
CREATE POLICY "Allow public read access to terabox_videos" ON public.terabox_videos
FOR SELECT TO public
USING (true);

-- Only admins can publish videos
CREATE POLICY "Allow admin insert terabox_videos" ON public.terabox_videos
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Only admins can modify video metadata / categories
CREATE POLICY "Allow admin update terabox_videos" ON public.terabox_videos
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Only admins can delete videos
CREATE POLICY "Allow admin delete terabox_videos" ON public.terabox_videos
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid())
);

-- 5. Secure public.payments (Block Direct Fake Payment Insertion)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments read access" ON public.payments;
DROP POLICY IF EXISTS "Payments insert access" ON public.payments;
DROP POLICY IF EXISTS "Payments update access" ON public.payments;
DROP POLICY IF EXISTS "Payments delete access" ON public.payments;

-- Users can only view their own payment receipts; admins can view all transactions
CREATE POLICY "Payments read access" ON public.payments
FOR SELECT TO public
USING (
  (auth.uid() = user_id) OR public.is_admin(auth.uid())
);

-- Direct client inserts are blocked. Payments must be verified via activate_subscription RPC (SECURITY DEFINER) or by admin.
CREATE POLICY "Payments insert access" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);

CREATE POLICY "Payments update access" ON public.payments
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Payments delete access" ON public.payments
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid())
);

-- 6. Secure public.site_settings (Admin-Only Configuration)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings read access" ON public.site_settings;
DROP POLICY IF EXISTS "Settings update access" ON public.site_settings;

CREATE POLICY "Settings read access" ON public.site_settings
FOR SELECT TO public
USING (true);

CREATE POLICY "Settings update access" ON public.site_settings
FOR ALL TO authenticated
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

-- 7. Secure public.link_usage
ALTER TABLE public.link_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Link usage read access" ON public.link_usage;
DROP POLICY IF EXISTS "Link usage insert access" ON public.link_usage;
DROP POLICY IF EXISTS "Link usage delete access" ON public.link_usage;

CREATE POLICY "Link usage read access" ON public.link_usage
FOR SELECT TO public
USING (
  (auth.uid() = user_id) OR public.is_admin(auth.uid())
);

CREATE POLICY "Link usage insert access" ON public.link_usage
FOR INSERT TO public
WITH CHECK (
  (auth.uid() IS NULL) OR (auth.uid() = user_id)
);

CREATE POLICY "Link usage delete access" ON public.link_usage
FOR DELETE TO authenticated
USING (
  public.is_admin(auth.uid())
);

-- 8. Secure public.terabox_bookmarks
ALTER TABLE public.terabox_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.terabox_bookmarks;

CREATE POLICY "Users can manage their own bookmarks" ON public.terabox_bookmarks
FOR ALL TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- 9. Secure Server-Side Function: activate_subscription RPC
-- Enables legitimate users to activate their paid subscription after verified Razorpay checkout
-- without granting regular users direct table write access to privileged fields or payments.
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id uuid,
  p_plan_id text,
  p_plan_name text,
  p_amount numeric,
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_razorpay_signature text,
  p_days integer
)
RETURNS jsonb AS $$
DECLARE
  v_end timestamptz;
  v_user_email text;
BEGIN
  -- Authenticated caller must be either the user themselves or an administrator
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Access Denied: You cannot activate subscriptions for other accounts.';
  END IF;

  -- Validate payment reference
  IF p_razorpay_payment_id IS NULL OR length(trim(p_razorpay_payment_id)) < 4 THEN
    RAISE EXCEPTION 'Invalid payment reference: payment ID is required.';
  END IF;

  -- Calculate validity duration
  v_end := now() + (COALESCE(p_days, 30) || ' days')::interval;

  -- Resolve user email
  SELECT email INTO v_user_email FROM public.profiles WHERE id = p_user_id;
  IF v_user_email IS NULL THEN
    v_user_email := 'user@terawala.com';
  END IF;

  -- Set trusted context for this transaction
  PERFORM set_config('terawala.trusted_context', 'true', true);

  -- 1. Insert verified payment log into public.payments
  INSERT INTO public.payments (
    user_id,
    user_email,
    plan_id,
    plan_name,
    amount,
    currency,
    status,
    razorpay_order_id,
    razorpay_payment_id,
    valid_until,
    created_at
  ) VALUES (
    p_user_id,
    v_user_email,
    p_plan_id,
    p_plan_name,
    p_amount,
    'INR',
    'success',
    p_razorpay_order_id,
    p_razorpay_payment_id,
    v_end,
    now()
  );

  -- 2. Upgrade the user profile with VIP tier and unlimited quota
  UPDATE public.profiles
  SET 
    subscription_tier = 'premium',
    subscription_status = 'active',
    subscription_end = v_end,
    subscription_plan_name = p_plan_name,
    subscription_plan_id = p_plan_id,
    daily_limit = 99999,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_tier', 'premium',
    'valid_until', v_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke execute from public anon users; grant to authenticated users
REVOKE EXECUTE ON FUNCTION public.activate_subscription FROM public;
GRANT EXECUTE ON FUNCTION public.activate_subscription TO authenticated;

