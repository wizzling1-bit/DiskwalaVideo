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

async function generateHmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function secureTimingCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

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
    const supabaseUrl = (context.env?.PUBLIC_SUPABASE_URL || 'https://fyjeyhrkuuuxxwhjnhov.supabase.co').replace(/\/+$/, '');
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
        details: 'You must be signed in to verify payment.'
      }), { status: 401, headers: corsHeaders });
    }
    const userToken = authHeader!.replace(/^Bearer\s+/i, '').trim();

    // 2. Parse and validate verification payload
    const body = await context.request.json().catch(() => null) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      plan_id?: string;
    } | null;

    const orderId = (body?.razorpay_order_id || '').trim();
    const paymentId = (body?.razorpay_payment_id || '').trim();
    const signature = (body?.razorpay_signature || '').trim();
    const planId = (body?.plan_id || '').trim();

    if (!orderId || !paymentId || !signature || !planId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bad Request',
        details: 'Missing order_id, payment_id, signature, or plan_id in verification payload.'
      }), { status: 400, headers: corsHeaders });
    }

    const plan = SERVER_PLANS[planId];
    if (!plan) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Plan',
        details: 'Specified plan is unknown or not supported.'
      }), { status: 400, headers: corsHeaders });
    }

    // 3. Cryptographic Signature Verification: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = await generateHmacSha256(keySecret, `${orderId}|${paymentId}`);
    if (!secureTimingCompare(expectedSignature, signature)) {
      console.warn(`Payment signature mismatch for user ${user.id}, order ${orderId}, payment ${paymentId}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Signature Mismatch',
        details: 'Cryptographic signature verification failed. Payment cannot be authenticated.'
      }), { status: 400, headers: corsHeaders });
    }

    // 4. Double-check directly with Razorpay REST API
    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${basicAuth}`
      }
    });

    if (!rzpPayRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Gateway Verification Failed',
        details: 'Could not fetch payment record from Razorpay servers.'
      }), { status: 502, headers: corsHeaders });
    }

    const rzpPayment = await rzpPayRes.json() as any;

    // Verify order ID match
    if (rzpPayment.order_id && rzpPayment.order_id !== orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order Mismatch',
        details: 'Payment does not correspond to the specified order.'
      }), { status: 400, headers: corsHeaders });
    }

    // Verify amount match
    const expectedAmountPaise = plan.price * 100;
    if (rzpPayment.amount !== expectedAmountPaise) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Amount Mismatch',
        details: `Payment amount ₹${rzpPayment.amount / 100} does not match expected plan price ₹${plan.price}.`
      }), { status: 400, headers: corsHeaders });
    }

    // Verify user ID note (prevent cross-user payment theft)
    if (rzpPayment.notes?.user_id && rzpPayment.notes.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ownership Mismatch',
        details: 'This payment order belongs to a different account.'
      }), { status: 403, headers: corsHeaders });
    }

    // Auto-capture if authorized
    if (rzpPayment.status === 'authorized') {
      await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: expectedAmountPaise, currency: 'INR' })
      });
    } else if (rzpPayment.status !== 'captured') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment Not Captured',
        details: `Payment status is "${rzpPayment.status}". Only captured payments grant VIP access.`
      }), { status: 400, headers: corsHeaders });
    }

    // 5. Activate VIP subscription in Supabase via RPC
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/activate_subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'apikey': anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_user_id: user.id,
        p_plan_id: plan.id,
        p_plan_name: plan.name,
        p_amount: plan.price,
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_razorpay_signature: signature,
        p_days: plan.days
      })
    });

    const rpcData = await rpcRes.json().catch(() => null) as any;
    if (!rpcRes.ok) {
      console.error('Supabase activate_subscription failed:', rpcData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Activation Error',
        details: 'Payment was verified, but database subscription activation failed. Please contact support.'
      }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'success',
      message: 'Payment verified and VIP subscription activated successfully.',
      payment_id: paymentId,
      order_id: orderId,
      plan_name: plan.name,
      valid_until: rpcData?.valid_until || null
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal Error',
      details: err?.message || 'Unexpected server error while verifying payment.'
    }), { status: 500, headers: corsHeaders });
  }
}
