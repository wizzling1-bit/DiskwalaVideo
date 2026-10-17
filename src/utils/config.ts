/**
 * TeraWala — Global Application Configuration
 * Primary Domain: terawala.com
 * Main Keywords: TeraWala, terabox video downloader, diskwala video downloader, online video player
 */

export const APP_CONFIG = {
  siteName: 'TeraWala — Terabox & Diskwala Video Downloader & Online Video Player',
  siteUrl: 'https://terawala.com',
  brandShort: 'TeraWala',
  
  // Official Telegram Community Link (Updated to official)
  telegramBotUrl: 'https://telegram.me/terawala_official',
  telegramChannelUrl: 'https://telegram.me/terawala_official',

  // Daily Free Quota
  dailyFreeLimit: 5,

  // Supabase Configuration
  supabase: {
    url: (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) || 'https://fyjeyhrkuuuxxwhjnhov.supabase.co',
    anonKey: (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5amV5aHJrdXV1eHh3aGpuaG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTcxNTAsImV4cCI6MjEwNzc5MzE1MH0.eZIc7JQ9X3niGjNTjGmiztedCqwKpeEWrDFgE9c2VOw'
  },

  // Razorpay Configuration
  razorpay: {
    keyId: (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_RAZORPAY_KEY_ID) || (typeof process !== 'undefined' && process.env?.PUBLIC_RAZORPAY_KEY_ID) || 'rzp_live_RsEo8sPBUJeTq8'
  },

  // Pricing Plans (Updated: ₹9 / 24h, ₹99 / 1m, ₹249 / 3m, ₹999 / 1y)
  plans: [
    {
      id: 'plan_starter_24h',
      tierCode: 'vip_turbo',
      name: 'Turbo 24h VIP',
      price: 9,
      period: '24 Hours',
      days: 1,
      links: 'Unlimited',
      badge: 'Quick Pass',
      description: 'Ideal for quick batch downloads and single-day HD binge streaming.',
      features: [
        'Unlimited Links for 24 Hours',
        'Instant Cloud Server Unlocking',
        'Full 1080p HD Stream Online',
        'Direct High-Speed MP4 Downloads',
        'Zero Waiting Queue'
      ]
    },
    {
      id: 'plan_pro_monthly',
      tierCode: 'vip_pro',
      name: 'Pro Monthly VIP',
      price: 99,
      period: '30 Days',
      days: 30,
      links: 'Unlimited',
      badge: 'Popular Choice',
      description: 'The standard VIP pass for regular viewers, power converters, and daily binge watchers.',
      features: [
        'Unlimited Links for 30 Days',
        'Dedicated VIP High-Speed CDN',
        '1080p Full HD & 4K Streaming',
        'One-Click Direct Downloads',
        'Zero Advertisements or Popups',
        'Priority Customer Support'
      ]
    },
    {
      id: 'plan_quarterly_3m',
      tierCode: 'vip_ultra',
      name: 'Ultra Quarterly VIP',
      price: 249,
      period: '90 Days',
      days: 90,
      badge: 'Power Binge',
      links: 'Unlimited',
      description: 'Most popular VIP package for non-stop streaming and unlimited link conversions.',
      features: [
        'Unlimited Links for 90 Days',
        'Maximum CDN Speed Priority',
        'Instant 4K Playback & Batch Links',
        'Multi-Device Browser Access',
        'Ad-Free Clean Experience',
        'Priority 24/7 VIP Assistance'
      ]
    },
    {
      id: 'plan_unlimited_year',
      tierCode: 'vip_elite',
      name: 'Elite Annual VIP',
      price: 999,
      period: '365 Days',
      days: 365,
      badge: 'Best Value (Save 60%)',
      links: 'Unlimited',
      description: 'Unrestricted high-speed access for a whole year at less than ₹83/month.',
      features: [
        'Unlimited Links for 365 Days',
        'Highest Priority Cloud Pipeline',
        'Instant 4K Playback & Folder Links',
        'VIP Telegram Channel Access',
        'Early Access to New Platform Tools',
        'Dedicated VIP Account Priority'
      ]
    }
  ],

  // Supported URL Hostnames (Terabox & Diskwala ecosystems)
  supportedHosts: [
    'terabox.com',
    'www.terabox.com',
    'teraboxapp.com',
    'www.teraboxapp.com',
    'terabox.app',
    '1024tera.com',
    'www.1024tera.com',
    '1024terabox.com',
    'www.1024terabox.com',
    'terasharelink.com',
    'www.terasharelink.com',
    'freeterabox.com',
    'www.freeterabox.com',
    'mirrobox.com',
    'www.mirrobox.com',
    'nephobox.com',
    'www.nephobox.com',
    '4funbox.com',
    'www.4funbox.com',
    'terabox.link',
    'www.terabox.link',
    'diskwala.com',
    'www.diskwala.com',
    'flezen.com',
    'www.flezen.com'
  ],

  // Sample demo links for instant testing (Real working link)
  sampleLink: 'https://1024terabox.com/s/1jV4tzRwAj_9sTwW7b30sXQ',
  sampleTeraboxLink: 'https://1024terabox.com/s/1jV4tzRwAj_9sTwW7b30sXQ',
  
  // TeraBox API Configuration (xAPIverse)
  xapiverse: {
    apiUrl: 'https://xapiverse.com/api/terabox',
    apiKey: 'xapi_e8ad5454c8b1d7f8935b5482fa6aa52d'
  },

  // Contact & Support
  supportEmail: 'support@terawala.com'
};
