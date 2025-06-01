// ===== CONFIG.JS - КОНФІГУРАЦІЯ ТА КОНСТАНТИ =====

// Основна конфігурація додатку
export const CONFIG = {
    // API Endpoints
    api: {
        menu: '/api/menu',
        orders: '/api/orders', 
        contact: '/api/contact',
        reviews: '/api/reviews'
    },
    
    // Інформація про бізнес
    business: {
        name: 'Ковчег Ноя',
        phone: '+380671234567',
        phone2: '+380501234567',
        email: 'info@noahs-ark.com.ua',
        address: 'вул. В\'ячеслава Зайцева, 19, Запоріжжя, 69000',
        oldAddress: 'вул. Лермонтова, 19', // Для зворотної сумісності
        coordinates: {
            lat: 47.8388,
            lng: 35.1396
        },
        workingHours: {
            open: '09:00',
            close: '23:00',
            deliveryClose: '22:30'
        },
        socialMedia: {
            facebook: 'https://facebook.com/noahs-ark-zaporizhzhia',
            instagram: 'https://instagram.com/noahs_ark_zp',
            telegram: 'https://t.me/noahs_ark_bot',
            viber: 'viber://chat?number=%2B380671234567'
        }
    },
    
    // Налаштування UI
    ui: {
        animationDuration: 300,
        scrollOffset: 80,
        mobileBreakpoint: 768,
        tabletBreakpoint: 992,
        desktopBreakpoint: 1200
    },
    
    // Налаштування кошика
    cart: {
        minOrderAmount: 150,
        deliveryFee: 30,
        freeDeliveryThreshold: 300,
        maxItems: 50,
        storageKey: 'noahs_ark_cart'
    },
    
    // Налаштування карт
    maps: {
        googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
        zoom: 16,
        marker: {
            title: 'Ковчег Ноя - Вірменська кухня',
            description: 'Найсмачніша шаурма в Запоріжжі'
        }
    },
    
    // SEO та аналітика
    analytics: {
        googleAnalyticsId: 'G-XXXXXXXXXX',
        facebookPixelId: 'XXXXXXXXXX',
        hotjarId: 'XXXXXXX'
    },
    
    // Налаштування форм
    forms: {
        maxMessageLength: 1000,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
        maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    
    // Налаштування відгуків
    reviews: {
        maxRating: 5,
        minTextLength: 10,
        maxTextLength: 500
    },
    
    // Налаштування доставки
    delivery: {
        zones: [
            {
                name: 'Центр міста',
                radius: 5, // км
                fee: 30,
                freeThreshold: 300
            },
            {
                name: 'Передмістя',
                radius: 10, // км
                fee: 50,
                freeThreshold: 400
            }
        ],
        estimatedTime: {
            min: 30,
            max: 45
        }
    },
    
    // Налаштування повідомлень
    notifications: {
        defaultDuration: 5000,
        errorDuration: 8000,
        maxVisible: 5
    },
    
    // Версія додатку
    version: '1.0.0',
    
    // Режим розробки
    isDevelopment: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1'
};

// Локалізація
export const MESSAGES = {
    errors: {
        network: 'Помилка з\'єднання з сервером',
        validation: 'Перевірте правильність заповнення форми',
        required: 'Це поле обов\'язкове для заповнення',
        email: 'Введіть коректний email адрес',
        phone: 'Введіть коректний номер телефону',
        minLength: 'Занадто короткий текст',
        maxLength: 'Занадто довгий текст',
        fileSize: 'Файл занадто великий',
        fileType: 'Недопустимий тип файлу',
        cartEmpty: 'Додайте страви до кошика',
        minOrder: 'Мінімальна сума замовлення',
        restaurantClosed: 'Ресторан зараз зачинено'
    },
    success: {
        orderPlaced: 'Замовлення прийнято! Ми зв\'яжемося з вами найближчим часом',
        messageSent: 'Повідомлення відправлено успішно',
        addedToCart: 'Додано до кошика',
        removedFromCart: 'Видалено з кошика',
        cartCleared: 'Кошик очищено'
    },
    info: {
        loading: 'Завантаження...',
        processing: 'Обробка...',
        selectSize: 'Оберіть розмір страви',
        workingHours: 'Працюємо з 09:00 до 23:00',
        deliveryTime: 'Час доставки: 30-45 хвилин'
    },
    warnings: {
        unsavedChanges: 'У вас є незбережені зміни',
        confirmDelete: 'Ви впевнені, що хочете видалити?',
        confirmClear: 'Очистити весь кошик?'
    }
};

// Валідаційні правила
export const VALIDATION_RULES = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: MESSAGES.errors.email
    },
    phone: {
        pattern: /^[\+]?[0-9\(\)\-\s]{10,}$/,
        message: MESSAGES.errors.phone
    },
    name: {
        pattern: /^[a-zA-Zа-яА-ЯіІїЇєЄ\s]{2,50}$/,
        message: 'Ім\'я повинно містити тільки літери (2-50 символів)'
    },
    address: {
        minLength: 10,
        maxLength: 200,
        message: 'Адреса повинна містити 10-200 символів'
    },
    message: {
        minLength: 10,
        maxLength: 1000,
        message: 'Повідомлення повинно містити 10-1000 символів'
    }
};

// Статуси замовлень
export const ORDER_STATUSES = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERING: 'delivering',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Типи сповіщень
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Категорії меню
export const MENU_CATEGORIES = {
    SHAWARMA: 'shawarma',
    KEBAB: 'kebab',
    GRILL: 'grill',
    BURGERS: 'burgers',
    HOTDOGS: 'hotdogs',
    SIDES: 'sides',
    SAUCES: 'sauces',
    DRINKS: 'drinks',
    DESSERTS: 'desserts'
};

// Події для аналітики
export const ANALYTICS_EVENTS = {
    PAGE_VIEW: 'page_view',
    MENU_CATEGORY_CLICK: 'menu_category_click',
    ADD_TO_CART: 'add_to_cart',
    REMOVE_FROM_CART: 'remove_from_cart',
    CART_OPENED: 'cart_opened',
    CHECKOUT_STARTED: 'checkout_started',
    ORDER_COMPLETED: 'order_completed',
    FORM_SUBMITTED: 'form_submitted',
    PHONE_CALL: 'phone_call',
    DIRECTIONS_REQUESTED: 'directions_requested',
    SOCIAL_CLICK: 'social_click'
};

// Breakpoints для responsive дизайну
export const BREAKPOINTS = {
    XS: 480,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400
};

// Налаштування для Local Storage
export const STORAGE_KEYS = {
    CART: 'noahs_ark_cart',
    USER_PREFERENCES: 'noahs_ark_preferences',
    RECENT_ORDERS: 'noahs_ark_recent_orders',
    VIEWED_ITEMS: 'noahs_ark_viewed_items'
};

// Дефолтні налаштування користувача
export const DEFAULT_USER_PREFERENCES = {
    language: 'uk',
    theme: 'light',
    notifications: true,
    autoLocation: false,
    favoriteItems: [],
    recentAddresses: []
};

// Конфігурація для PWA
export const PWA_CONFIG = {
    name: 'Ковчег Ноя',
    shortName: 'Ковчег Ноя',
    description: 'Найсмачніша шаурма та вірменська кухня в Запоріжжі',
    themeColor: '#D2001F',
    backgroundColor: '#FFFFFF',
    display: 'standalone',
    orientation: 'portrait',
    startUrl: '/',
    scope: '/'
};

// Експорт всіх конфігурацій як дефолтний об'єкт
export default {
    CONFIG,
    MESSAGES,
    VALIDATION_RULES,
    ORDER_STATUSES,
    NOTIFICATION_TYPES,
    MENU_CATEGORIES,
    ANALYTICS_EVENTS,
    BREAKPOINTS,
    STORAGE_KEYS,
    DEFAULT_USER_PREFERENCES,
    PWA_CONFIG
};