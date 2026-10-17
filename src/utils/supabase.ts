import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { APP_CONFIG } from './config';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  subscription_tier: 'free' | 'premium' | 'vip';
  subscription_status: 'active' | 'expired' | 'cancelled';
  subscription_plan_name?: string | null;
  subscription_plan_id?: string | null;
  subscription_end?: string | null;
  daily_limit: number;
  created_at: string;
  updated_at?: string;
}

export interface LinkUsageRecord {
  id?: string;
  user_id?: string | null;
  user_email?: string | null;
  link_url: string;
  provider: string;
  file_name?: string;
  file_size?: string;
  status: string;
  created_at?: string;
}

export interface DailyLimitCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  tier: string;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = APP_CONFIG.supabase.url;
    const supabaseAnonKey = APP_CONFIG.supabase.anonKey;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    });
  }
  return supabaseInstance;
}

/**
 * Sign up a new user with email & password
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0]
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in existing user with email & password
 */
export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Get user profile and tier details
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const sb = getSupabase();
  let targetId = userId;

  if (!targetId) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    targetId = user.id;
  }

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching user profile:', error.message);
    return null;
  }

  return data as UserProfile | null;
}

/**
 * Check daily 5 link usage for free users or unlimited for VIP
 */
export async function checkDailyQuota(): Promise<DailyLimitCheck> {
  const todayKey = `tw_daily_${new Date().toISOString().slice(0, 10)}`;
  const localUsage = typeof window !== 'undefined' ? parseInt(localStorage.getItem(todayKey) || '0', 10) : 0;
  const defaultFreeLimit = APP_CONFIG.dailyFreeLimit || 5;

  try {
    const user = await getCurrentUser();
    if (!user) {
      // Anonymous / Guest User
      const remaining = Math.max(0, defaultFreeLimit - localUsage);
      return {
        allowed: localUsage < defaultFreeLimit,
        used: localUsage,
        limit: defaultFreeLimit,
        remaining,
        isPremium: false,
        tier: 'guest'
      };
    }

    // Authenticated User
    const profile = await getUserProfile(user.id);
    const isPremium = profile?.subscription_tier === 'premium' || 
                      profile?.subscription_tier === 'vip' || 
                      profile?.role === 'admin';

    if (isPremium) {
      return {
        allowed: true,
        used: localUsage,
        limit: 99999,
        remaining: 99999,
        isPremium: true,
        tier: profile?.subscription_tier || 'premium'
      };
    }

    const sb = getSupabase();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error } = await sb
      .from('link_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    const actualCount = error ? localUsage : (count !== null ? count : localUsage);
    const userLimit = profile?.daily_limit || defaultFreeLimit;
    const remaining = Math.max(0, userLimit - actualCount);

    return {
      allowed: actualCount < userLimit,
      used: actualCount,
      limit: userLimit,
      remaining,
      isPremium: false,
      tier: 'free'
    };
  } catch (err) {
    console.error('Failed to query daily limit:', err);
    return {
      allowed: localUsage < defaultFreeLimit,
      used: localUsage,
      limit: defaultFreeLimit,
      remaining: Math.max(0, defaultFreeLimit - localUsage),
      isPremium: false,
      tier: 'free'
    };
  }
}

/**
 * Record link resolution in Supabase and update local counter
 */
export async function recordLinkUsage(
  url: string,
  provider: string = 'terabox',
  fileName?: string,
  fileSize?: string
): Promise<void> {
  const todayKey = `tw_daily_${new Date().toISOString().slice(0, 10)}`;
  if (typeof window !== 'undefined') {
    const current = parseInt(localStorage.getItem(todayKey) || '0', 10);
    localStorage.setItem(todayKey, (current + 1).toString());
  }

  try {
    const sb = getSupabase();
    const user = await getCurrentUser();

    await sb.from('link_usage').insert({
      user_id: user ? user.id : null,
      user_email: user ? user.email : null,
      link_url: url,
      provider: provider,
      file_name: fileName || 'Video File',
      file_size: fileSize || '',
      status: 'success'
    });
  } catch (err) {
    console.warn('Could not sync link usage to Supabase:', err);
  }
}

/**
 * Activate subscription via RPC after successful Razorpay payment
 */
export async function activateSubscriptionViaRPC(params: {
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  days: number;
}) {
  const sb = getSupabase();
  try {
    const { data, error } = await sb.rpc('activate_subscription', {
      p_user_id: params.userId,
      p_plan_id: params.planId,
      p_plan_name: params.planName,
      p_amount: params.amount,
      p_razorpay_order_id: params.razorpayOrderId || 'direct_' + Date.now(),
      p_razorpay_payment_id: params.razorpayPaymentId,
      p_razorpay_signature: params.razorpaySignature || '',
      p_days: params.days
    });

    if (!error) return data;
    console.warn('RPC activate_subscription returned error, trying direct update:', error);
  } catch (rpcErr) {
    console.warn('RPC activate_subscription threw exception, trying direct update:', rpcErr);
  }

  // Direct table update fallback
  const vEnd = new Date();
  vEnd.setDate(vEnd.getDate() + (params.days || 30));

  const { error: profileErr } = await sb
    .from('profiles')
    .update({
      subscription_tier: 'premium',
      subscription_status: 'active',
      subscription_end: vEnd.toISOString(),
      subscription_plan_name: params.planName,
      subscription_plan_id: params.planId,
      daily_limit: 99999,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.userId);

  if (profileErr) throw profileErr;

  // Log payment record
  try {
    const user = await getCurrentUser();
    await sb.from('payments').insert({
      user_id: params.userId,
      user_email: user?.email || '',
      razorpay_order_id: params.razorpayOrderId || 'direct_' + Date.now(),
      razorpay_payment_id: params.razorpayPaymentId,
      razorpay_signature: params.razorpaySignature || '',
      plan_id: params.planId,
      plan_name: params.planName,
      amount: params.amount,
      currency: 'INR',
      status: 'paid',
      valid_until: vEnd.toISOString()
    });
  } catch (payErr) {
    console.warn('Payment logging note:', payErr);
  }

  return { success: true, valid_until: vEnd.toISOString(), plan_name: params.planName };
}
