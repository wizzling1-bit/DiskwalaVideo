/**
 * TeraWala Internationalization (i18n) Architecture
 * Multi-language support for top user regions:
 * - English (en) - Global
 * - Hindi (hi) - India (High Diskwala & TeraBox search volume)
 * - Bengali (bn) - India / Bangladesh
 * - Indonesian (id) - Indonesia (Massive TeraBox cloud usage)
 * - Spanish (es) - Latin America & Spain
 * - Russian (ru) - CIS / Telegram audience
 */

export type Locale = 'en' | 'hi' | 'bn' | 'id' | 'es' | 'ru';

export interface LocaleConfig {
  code: Locale;
  label: string;
  nativeLabel: string;
  isPublished: boolean;
  htmlLang: string;
  flag: string;
}

export const LOCALES: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    isPublished: true,
    htmlLang: 'en-US',
    flag: '🇺🇸'
  },
  hi: {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    isPublished: true,
    htmlLang: 'hi-IN',
    flag: '🇮🇳'
  },
  bn: {
    code: 'bn',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    isPublished: true,
    htmlLang: 'bn-BD',
    flag: '🇧🇩'
  },
  id: {
    code: 'id',
    label: 'Indonesian',
    nativeLabel: 'Bahasa Indonesia',
    isPublished: true,
    htmlLang: 'id-ID',
    flag: '🇮🇩'
  },
  es: {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    isPublished: true,
    htmlLang: 'es-ES',
    flag: '🇪🇸'
  },
  ru: {
    code: 'ru',
    label: 'Russian',
    nativeLabel: 'Русский',
    isPublished: true,
    htmlLang: 'ru-RU',
    flag: '🇷🇺'
  }
};

export const DEFAULT_LOCALE: Locale = 'en';

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.terabox': 'TeraBox',
    'nav.diskwala': 'Diskwala',
    'nav.flezen': 'Flezen',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.joinTg': 'Join Telegram',
    'hero.badge': 'Free · Simple · Online',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'Video Downloader & Player',
    'hero.desc': 'The fast, free online video downloader and player supporting TeraBox, Diskwala, and Flezen. Paste any supported video link below for instant browser streaming or high-speed MP4 downloads with zero ads.',
    'form.placeholder': 'Paste your TeraBox, Diskwala, or Flezen link here...',
    'form.submit': 'Play & Download',
    'form.paste': 'Paste',
    'form.trySample': '⚡ Try sample:',
    'form.analyzing': 'Analyzing link & preparing video stream...',
    'ready.title': 'Your video is ready! Open our official Telegram Bot to watch and download in HD.',
    'ready.btn': 'Open in Telegram Bot',
    'card.botTitle': 'Instant Telegram Downloader',
    'card.botDesc': 'Process files instantly inside Telegram. Bypass browser advertisements, download in bulk, and watch on any network.',
    'card.playerTitle': 'High-Speed Web Player',
    'card.playerDesc': 'Enjoy lightning-fast video previewing, priority buffering speeds, ad-free player experience, and zero registration required.',
    'platforms.title': 'Download Videos From Any Platform',
    'platforms.desc': 'TeraWala supports all major cloud video platforms. Choose your provider below for dedicated guides, tools, and FAQs.',
    'footer.rights': 'All rights reserved.',
    'footer.disclaimer': 'Independent link analysis and playback tool. Not affiliated with TeraBox, Diskwala, or Flezen.'
  },
  hi: {
    'nav.home': 'होम',
    'nav.terabox': 'टेराबॉक्स',
    'nav.diskwala': 'डिस्कवाला',
    'nav.flezen': 'फ्लेज़ेन',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क करें',
    'nav.joinTg': 'टेलीग्राम से जुड़ें',
    'hero.badge': 'मुफ्त · आसान · ऑनलाइन',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'वीडियो डाउनलोडर और प्लेयर',
    'hero.desc': 'टेराबॉक्स, डिस्कवाला और फ्लेज़ेन के लिए सबसे तेज़ और मुफ्त ऑनलाइन वीडियो डाउनलोडर। बिना किसी ऐप या विज्ञापन के तुरंत ऑनलाइन देखें या हाई-स्पीड MP4 डाउनलोड करें।',
    'form.placeholder': 'अपना TeraBox, Diskwala या Flezen लिंक यहाँ पेस्ट करें...',
    'form.submit': 'चलाएं और डाउनलोड करें',
    'form.paste': 'पेस्ट करें',
    'form.trySample': '⚡ सैंपल टेस्ट करें:',
    'form.analyzing': 'लिंक का विश्लेषण और वीडियो स्ट्रीम तैयार हो रहा है...',
    'ready.title': 'आपका वीडियो तैयार है! HD में देखने और डाउनलोड करने के लिए आधिकारिक टेलीग्राम बॉट खोलें।',
    'ready.btn': 'टेलीग्राम बॉट में खोलें',
    'card.botTitle': 'तुरंत टेलीग्राम डाउनलोडर',
    'card.botDesc': 'टेलीग्राम के अंदर बिना विज्ञापन के सबसे तेज़ गति से ओरिजिनल MP4 वीडियो फाइल प्राप्त करें।',
    'card.playerTitle': 'हाई-स्पीड वेब प्लेयर',
    'card.playerDesc': 'ब्राउज़र में बिना किसी रुकावट या पंजीकरण के सीधे वीडियो स्ट्रीम का आनंद लें।',
    'platforms.title': 'किसी भी क्लाउड प्लेटफॉर्म से वीडियो डाउनलोड करें',
    'platforms.desc': 'TeraWala सभी प्रमुख क्लाउड प्लेटफॉर्म का समर्थन करता है। समर्पित टूल के लिए नीचे चुनें।',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    'footer.disclaimer': 'स्वतंत्र लिंक टूल। टेराबॉक्स, डिस्कवाला या फ्लेज़ेन से कोई आधिकारिक संबंध नहीं है।'
  },
  bn: {
    'nav.home': 'হোম',
    'nav.terabox': 'টেরাবক্স',
    'nav.diskwala': 'ডিস্কওয়ালা',
    'nav.flezen': 'ফ্লেজেন',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.contact': 'যোগাযোগ',
    'nav.joinTg': 'টেলিগ্রামে যুক্ত হন',
    'hero.badge': 'বিনামূল্যে · সহজ · অনলাইন',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'ভিডিও ডাউনলোডার ও প্লেয়ার',
    'hero.desc': 'টেরাবক্স, ডিস্কওয়ালা এবং ফ্লেজেনের জন্য দ্রুত ও বিনামূল্যের অনলাইন ভিডিও ডাউনলোডার। কোনো অ্যাপ ছাড়াই সরাসরি ব্রাউজারে দেখুন বা হাই-স্পিড MP4 ডাউনলোড করুন।',
    'form.placeholder': 'আপনার TeraBox, Diskwala বা Flezen লিঙ্ক এখানে পেস্ট করুন...',
    'form.submit': 'প্লে ও ডাউনলোড',
    'form.paste': 'পেস্ট',
    'form.trySample': '⚡ নমুনা লিঙ্ক:',
    'form.analyzing': 'লিঙ্ক যাচাই করা হচ্ছে এবং ভিডিও স্ট্রিম প্রস্তুত হচ্ছে...',
    'ready.title': 'আপনার ভিডিও প্রস্তুত! HD কোয়ালিটিতে দেখতে বা ডাউনলোড করতে আমাদের অফিসিয়াল টেলিগ্রাম বট খুলুন।',
    'ready.btn': 'টেলিগ্রাম বটে খুলুন',
    'card.botTitle': 'দ্রুত টেলিগ্রাম ডাউনলোডার',
    'card.botDesc': 'টেলিগ্রামের ভেতরে সরাসরি আসল MP4 ফাইল কোনো বিজ্ঞাপন ছাড়াই দ্রুত ডাউনলোড করুন।',
    'card.playerTitle': 'হাই-স্পিড ওয়েব প্লেয়ার',
    'card.playerDesc': 'কোনো অ্যাপ বা রেজিস্ট্রেশন ছাড়াই ব্রাউজারে সম্পূর্ণ ভিডিও প্রিভিউ দেখুন।',
    'platforms.title': 'যেকোনো ক্লাউড প্ল্যাটফর্ম থেকে ভিডিও ডাউনলোড করুন',
    'platforms.desc': 'TeraWala সব প্রধান ক্লাউড প্ল্যাটফর্ম সমর্থন করে। বিস্তারিত জানতে নিচের অপশন বাছুন।',
    'footer.rights': 'সর্বস্বত্ব সংরক্ষিত।',
    'footer.disclaimer': 'একটি স্বাধীন লিঙ্ক প্রসেসিং টুল। টেরাবক্স, ডিস্কওয়ালা বা ফ্লেজেনের সাথে কোনো সংশ্লিষ্টতা নেই।'
  },
  id: {
    'nav.home': 'Beranda',
    'nav.terabox': 'TeraBox',
    'nav.diskwala': 'Diskwala',
    'nav.flezen': 'Flezen',
    'nav.about': 'Tentang Kami',
    'nav.contact': 'Kontak',
    'nav.joinTg': 'Gabung Telegram',
    'hero.badge': 'Gratis · Mudah · Online',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'Pengunduh & Pemutar Video',
    'hero.desc': 'Pengunduh dan pemutar video online gratis dan cepat untuk TeraBox, Diskwala, dan Flezen. Tempel tautan video di bawah untuk streaming langsung tanpa iklan atau unduh MP4.',
    'form.placeholder': 'Tempel tautan TeraBox, Diskwala, atau Flezen di sini...',
    'form.submit': 'Putar & Unduh',
    'form.paste': 'Tempel',
    'form.trySample': '⚡ Coba contoh:',
    'form.analyzing': 'Menganalisis tautan dan menyiapkan streaming video...',
    'ready.title': 'Video Anda siap! Buka Bot Telegram resmi kami untuk menonton dan mengunduh dalam kualitas HD.',
    'ready.btn': 'Buka di Bot Telegram',
    'card.botTitle': 'Pengunduh Telegram Cepat',
    'card.botDesc': 'Dapatkan file video MP4 asli langsung di Telegram dengan kecepatan maksimal tanpa iklan.',
    'card.playerTitle': 'Pemutar Web Cepat',
    'card.playerDesc': 'Nikmati pratinjau video langsung di browser Anda tanpa perlu menginstal aplikasi apa pun.',
    'platforms.title': 'Unduh Video dari Berbagai Platform',
    'platforms.desc': 'TeraWala mendukung semua platform penyimpanan cloud terpopuler. Pilih layanan Anda di bawah.',
    'footer.rights': 'Hak cipta dilindungi undang-undang.',
    'footer.disclaimer': 'Alat analisis tautan independen. Tidak berafiliasi dengan TeraBox, Diskwala, atau Flezen.'
  },
  es: {
    'nav.home': 'Inicio',
    'nav.terabox': 'TeraBox',
    'nav.diskwala': 'Diskwala',
    'nav.flezen': 'Flezen',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',
    'nav.joinTg': 'Unirse a Telegram',
    'hero.badge': 'Gratis · Sencillo · Online',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'Descargador y Reproductor de Video',
    'hero.desc': 'Descargador y reproductor de video en línea rápido y gratuito para TeraBox, Diskwala y Flezen. Pega cualquier enlace para reproducir sin anuncios o descargar MP4 en alta velocidad.',
    'form.placeholder': 'Pega tu enlace de TeraBox, Diskwala o Flezen aquí...',
    'form.submit': 'Reproducir y Descargar',
    'form.paste': 'Pegar',
    'form.trySample': '⚡ Probar ejemplo:',
    'form.analyzing': 'Analizando enlace y preparando transmisión de video...',
    'ready.title': '¡Tu video está listo! Abre nuestro bot oficial de Telegram para ver y descargar en HD.',
    'ready.btn': 'Abrir en Bot de Telegram',
    'card.botTitle': 'Descargador Directo de Telegram',
    'card.botDesc': 'Descarga archivos MP4 originales a máxima velocidad a través de la infraestructura CDN de Telegram.',
    'card.playerTitle': 'Reproductor Web de Alta Velocidad',
    'card.playerDesc': 'Transmite videos directamente en tu navegador sin descargas de aplicaciones ni registros requeridos.',
    'platforms.title': 'Descarga videos de cualquier plataforma en la nube',
    'platforms.desc': 'TeraWala es compatible con las principales plataformas de video. Elige tu herramienta a continuación.',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.disclaimer': 'Herramienta independiente. No está afiliada a TeraBox, Diskwala o Flezen.'
  },
  ru: {
    'nav.home': 'Главная',
    'nav.terabox': 'TeraBox',
    'nav.diskwala': 'Diskwala',
    'nav.flezen': 'Flezen',
    'nav.about': 'О нас',
    'nav.contact': 'Контакты',
    'nav.joinTg': 'Наш Telegram',
    'hero.badge': 'Бесплатно · Просто · Онлайн',
    'hero.prefix': 'TeraWala — ',
    'hero.accent': 'Загрузчик и онлайн-плеер',
    'hero.desc': 'Быстрый и бесплатный онлайн-плеер и загрузчик видео для TeraBox, Diskwala и Flezen. Вставьте ссылку для мгновенного просмотра в браузере или загрузки MP4 в HD без рекламы.',
    'form.placeholder': 'Вставьте ссылку TeraBox, Diskwala или Flezen сюда...',
    'form.submit': 'Смотреть и Скачать',
    'form.paste': 'Вставить',
    'form.trySample': '⚡ Тестовая ссылка:',
    'form.analyzing': 'Анализируем ссылку и готовим видеопоток...',
    'ready.title': 'Ваше видео готово! Откройте нашего официального Telegram-бота для просмотра и скачивания в HD.',
    'ready.btn': 'Открыть в Telegram-боте',
    'card.botTitle': 'Быстрый Telegram-загрузчик',
    'card.botDesc': 'Получайте оригинальные файлы MP4 на максимальной скорости через CDN Telegram без рекламы.',
    'card.playerTitle': 'Быстрый веб-плеер',
    'card.playerDesc': 'Смотрите видео прямо в браузере без установки APK-приложений и без регистрации.',
    'platforms.title': 'Скачивайте видео с любых платформ',
    'platforms.desc': 'TeraWala поддерживает все ключевые облачные сервисы. Выберите нужный раздел ниже.',
    'footer.rights': 'Все права защищены.',
    'footer.disclaimer': 'Независимый онлайн-инструмент. Не аффилирован с TeraBox, Diskwala или Flezen.'
  }
};

/**
 * Returns hrefLang tags for canonical and international indexing
 */
export function getHrefLangTags(path: string, baseUrl = 'https://terawala.com') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const publishedLocales = Object.values(LOCALES).filter((l) => l.isPublished);

  const tags = [
    {
      hreflang: 'x-default',
      href: `${baseUrl}${cleanPath}`
    }
  ];

  for (const loc of publishedLocales) {
    tags.push({
      hreflang: loc.code,
      href: `${baseUrl}${cleanPath}`
    });
  }

  return tags;
}
