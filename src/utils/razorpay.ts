import { APP_CONFIG } from './config';
import { getCurrentUser, getUserProfile, activateSubscriptionViaRPC } from './supabase';

export interface RazorpayPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  days: number;
  badge?: string;
  links: number | string;
  features: string[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Dynamically load the Razorpay SDK script if not already loaded
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Trigger Razorpay checkout modal for chosen plan
 */
export async function startRazorpayCheckout(
  plan: RazorpayPlan,
  callbacks?: {
    onSuccess?: (paymentData: any) => void;
    onDismiss?: () => void;
    onError?: (err: any) => void;
  }
) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to initialize Razorpay payment gateway. Please check your network connection.');
    callbacks?.onError?.(new Error('Gateway load failed'));
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    // Dispatch auth modal event to prompt login before payment
    window.dispatchEvent(new CustomEvent('terawala:open-auth', { 
      detail: { message: `Please log in or sign up first to attach your ${plan.name} to your account!` }
    }));
    return;
  }

  const profile = await getUserProfile(user.id);
  const userEmail = user.email || '';
  const userName = profile?.full_name || userEmail.split('@')[0];

  const options = {
    key: APP_CONFIG.razorpay.keyId,
    amount: plan.price * 100, // paise (e.g. ₹29 = 2900 paise)
    currency: 'INR',
    name: 'TeraWala VIP Pass',
    description: `${plan.name} (${plan.period}) — Instant HD Unlocking`,
    image: 'https://terawala.com/favicon-32x32.png',
    prefill: {
      name: userName,
      email: userEmail
    },
    notes: {
      plan_id: plan.id,
      user_id: user.id
    },
    theme: {
      color: '#10b981',
      backdrop_color: 'rgba(5, 7, 8, 0.92)'
    },
    modal: {
      ondismiss: function () {
        callbacks?.onDismiss?.();
      }
    },
    handler: async function (response: any) {
      try {
        // Activate subscription in Supabase
        await activateSubscriptionViaRPC({
          userId: user.id,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          razorpayOrderId: response.razorpay_order_id || `order_${Date.now()}`,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature || '',
          days: plan.days || 30
        });

        // Broadcast event for UI updates
        window.dispatchEvent(new CustomEvent('terawala:subscription-activated', {
          detail: { plan, paymentId: response.razorpay_payment_id }
        }));

        callbacks?.onSuccess?.(response);
      } catch (err: any) {
        console.error('Subscription activation failed:', err);
        showPaymentNotificationModal({
          type: 'warning',
          title: 'Payment Received — Activation Notice',
          message: `Payment ID: <strong>${response.razorpay_payment_id}</strong> was received, but automatic sync took longer than expected. Please message our Telegram support to verify your VIP pass immediately.`,
          telegramLink: APP_CONFIG.telegramChannelUrl
        });
        callbacks?.onError?.(err);
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (resp: any) {
      console.warn('Razorpay payment failed or gateway error:', resp.error);
      
      const desc = resp?.error?.description || 'Transaction declined or gateway rejected.';
      const isAuthError = desc.toLowerCase().includes('auth') || 
                          desc.toLowerCase().includes('oops') || 
                          desc.toLowerCase().includes('wrong') ||
                          desc.toLowerCase().includes('merchant');

      showPaymentNotificationModal({
        type: 'error',
        title: isAuthError ? 'Payment Gateway Notice' : 'Payment Failed',
        message: isAuthError 
          ? `Razorpay encountered an authorization issue (${desc}). Your merchant account may require activation or updated API credentials. You can also contact our team directly for instant UPI activation.`
          : desc,
        telegramLink: APP_CONFIG.telegramChannelUrl
      });

      callbacks?.onError?.(resp.error);
    });

    rzp.open();
  } catch (err: any) {
    console.error('Failed to open Razorpay modal:', err);
    showPaymentNotificationModal({
      type: 'error',
      title: 'Checkout Initialization Failed',
      message: 'Could not open payment gateway. Please ensure your Razorpay API credentials are active.',
      telegramLink: APP_CONFIG.telegramChannelUrl
    });
    callbacks?.onError?.(err);
  }
}

/**
 * Show a sleek in-app payment modal instead of a disruptive browser alert()
 */
function showPaymentNotificationModal(params: {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  telegramLink?: string;
}) {
  const existing = document.getElementById('terawala-payment-notice');
  if (existing) existing.remove();

  const isSuccess = params.type === 'success';
  const isWarning = params.type === 'warning';
  const accentColor = isSuccess ? '#10b981' : (isWarning ? '#f59e0b' : '#ef4444');
  const bgBadge = isSuccess ? 'rgba(16, 185, 129, 0.15)' : (isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)');

  const modalHtml = `
    <div id="terawala-payment-notice" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 7, 9, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid ${accentColor}44;
        box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 30px ${accentColor}22;
        border-radius: 18px;
        max-width: 460px;
        width: 100%;
        padding: 28px 24px;
        text-align: center;
        position: relative;
        animation: twFadeIn 0.25s ease-out;
      ">
        <div style="
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: ${bgBadge};
          border: 1.5px solid ${accentColor};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: ${accentColor};
        ">
          ${isSuccess 
            ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
          }
        </div>
        <h3 style="margin: 0 0 10px; font-size: 19px; font-weight: 800; color: #ffffff;">${params.title}</h3>
        <p style="margin: 0 0 22px; font-size: 13.5px; line-height: 1.6; color: #94a3b8;">${params.message}</p>
        
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          ${params.telegramLink ? `
            <a href="${params.telegramLink}" target="_blank" rel="noopener noreferrer" style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 18px;
              background: #0ea5e9;
              color: #ffffff;
              border-radius: 10px;
              font-size: 13px;
              font-weight: 700;
              text-decoration: none;
              transition: opacity 0.2s;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
              <span>Instant VIP via Telegram</span>
            </a>
          ` : ''}
          <button id="terawala-notice-close-btn" style="
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild!);

  document.getElementById('terawala-notice-close-btn')?.addEventListener('click', () => {
    document.getElementById('terawala-payment-notice')?.remove();
  });
}
