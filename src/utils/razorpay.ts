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
        alert('Payment was successful, but there was an error updating your profile. Please contact support@terawala.com with Payment ID: ' + response.razorpay_payment_id);
        callbacks?.onError?.(err);
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (resp: any) {
    alert(`Payment Failed: ${resp.error.description || 'Transaction declined'}`);
    callbacks?.onError?.(resp.error);
  });

  rzp.open();
}
