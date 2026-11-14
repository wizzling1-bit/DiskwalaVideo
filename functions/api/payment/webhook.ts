interface Env {
  RAZORPAY_WEBHOOK_SECRET?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

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

export async function onRequestPost(context: RequestContext): Promise<Response> {
  try {
    const webhookSecret = context.env?.RAZORPAY_WEBHOOK_SECRET || 'terawala_whsec_live_2026';
    const rzpSignature = context.request.headers.get('x-razorpay-signature');

    if (!rzpSignature) {
      return new Response(JSON.stringify({ error: 'Missing webhook signature header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawBody = await context.request.text();

    // Verify HMAC-SHA256 signature
    const expectedSignature = await generateHmacSha256(webhookSecret, rawBody);
    if (!secureTimingCompare(expectedSignature, rzpSignature)) {
      console.warn('Razorpay webhook signature verification failed.');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse event safely
    let event: any = null;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const eventType = event?.event;
    console.log(`Received authenticated Razorpay webhook: ${eventType} (ID: ${event?.payload?.payment?.entity?.id || 'N/A'})`);

    const supabaseUrl = (context.env?.PUBLIC_SUPABASE_URL || 'https://fyjeyhrkuuuxxwhjnhov.supabase.co').replace(/\/+$/, '');
    const anonKey = context.env?.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5amV5aHJrdXV1eHh3aGpuaG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTcxNTAsImV4cCI6MjEwNzc5MzE1MH0.eZIc7JQ9X3niGjNTjGmiztedCqwKpeEWrDFgE9c2VOw';

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event?.payload?.payment?.entity;
      const userId = payment?.notes?.user_id;
      const planId = payment?.notes?.plan_id;
      const planDays = parseInt(payment?.notes?.plan_days || '30', 10);
      const planName = payment?.notes?.plan_name || 'VIP Subscription';

      if (userId && planId && payment?.id) {
        // Idempotent subscription activation via Supabase RPC
        try {
          await fetch(`${supabaseUrl}/rest/v1/rpc/activate_subscription`, {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              p_user_id: userId,
              p_plan_id: planId,
              p_plan_name: planName,
              p_amount: (payment.amount || 0) / 100,
              p_razorpay_order_id: payment.order_id || 'wh_' + Date.now(),
              p_razorpay_payment_id: payment.id,
              p_razorpay_signature: rzpSignature,
              p_days: planDays
            })
          });
        } catch (e) {
          console.warn('Webhook auto-sync notice:', e);
        }
      }
    }

    return new Response(JSON.stringify({ status: 'ok', received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Webhook processing failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
