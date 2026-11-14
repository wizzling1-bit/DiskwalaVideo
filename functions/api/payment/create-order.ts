interface Env {
  RAZORPAY_KEY_ID?: string;
  PUBLIC_RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

interface ServerPlan {
  id: string;
  name: string;
  price: number;
  days: number;
}

const SERVER_PLANS: Record<string, ServerPlan> = {
  plan_starter_24h: { id: 'plan_starter_24h', name: 'Turbo 24h VIP', price: 9, days: 1 },
  plan_pro_monthly: { id: 'plan_pro_monthly', name: 'Pro Monthly VIP', price: 99, days: 30 },
  plan_quarterly_3m: { id: 'plan_quarterly_3m', name: 'Ultra Quarterly VIP', price: 249, days: 90 },
  plan_unlimited_year: { id: 'plan_unlimited_year', name: 'Elite Annual VIP', price: 999, days: 365 }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

async function getSupabaseUser(authHeader: string | null, supabaseUrl: string, anonKey: string): Promise<{ id: string; email?: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey
      }
    });
    if (!res.ok) return null;
    const userData = await res.json() as { id: string; email?: string };
    if (userData && userData.id) return { id: userData.id, email: userData.email };
    return null;
  } catch {
    return null;
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  try {
    const supabaseUrl = context.env?.PUBLIC_SUPABASE_URL || 'https://fyjeyhrkuuuxxwhjnhov.supabase.co';
    const anonKey = context.env?.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5amV5aHJrdXV1eHh3aGpuaG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTcxNTAsImV4cCI6MjEwNzc5MzE1MH0.eZIc7JQ9X3niGjNTjGmiztedCqwKpeEWrDFgE9c2VOw';
    const keyId = context.env?.RAZORPAY_KEY_ID || context.env?.PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TzwwtKPEYYEiHK';
    const keySecret = context.env?.RAZORPAY_KEY_SECRET || 'n37CwlaDEBvgBcF8VM64XsYc';

    // 1. Authenticate user
    const authHeader = context.request.headers.get('Authorization');
    const user = await getSupabaseUser(authHeader, supabaseUrl, anonKey);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        details: 'You must be signed in to create a payment order.'
      }), { status: 401, headers: corsHeaders });
    }

    // 2. Validate requested plan
    const body = await context.request.json().catch(() => null) as { plan_id?: string } | null;
    const planId = body?.plan_id;
    if (!planId || !SERVER_PLANS[planId]) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Plan',
        details: 'The selected VIP subscription plan is invalid or unavailable.'
      }), { status: 400, headers: corsHeaders });
    }

    const plan = SERVER_PLANS[planId];
    const amountInPaise = plan.price * 100;
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 3. Create genuine Razorpay Order via authenticated REST API
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          user_id: user.id,
          user_email: user.email || '',
          plan_id: plan.id,
          plan_name: plan.name,
          plan_days: String(plan.days)
        }
      })
    });

    const rzpData = await rzpRes.json() as any;
    if (!rzpRes.ok || !rzpData.id) {
      console.error('Razorpay order creation failed:', rzpData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Gateway Error',
        details: rzpData?.error?.description || 'Failed to initialize payment order with Razorpay.'
      }), { status: 502, headers: corsHeaders });
    }

    // 4. Return safe order details to client
    return new Response(JSON.stringify({
      success: true,
      order_id: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency || 'INR',
      key_id: keyId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        days: plan.days
      }
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal Error',
      details: err?.message || 'Unexpected server error while creating payment order.'
    }), { status: 500, headers: corsHeaders });
  }
}
