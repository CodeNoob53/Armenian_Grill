// ===== APP.JS - ГОЛОВНИЙ ФАЙЛ ІНІЦІАЛІЗАЦІЇ =====

// Core configuration and utilities
import { CONFIG, MESSAGES, ANALYTICS_EVENTS } from './config.js';
import { Utils, StorageUtils } from './utils.js';

// Core managers
import NavigationManager from './navigation.js';
import MenuManager from './menu-manager.js';
import CartManager from './cart-manager.js';
import FormManager from './form-manager.js';

// Service managers
import ToastManager, { getToastManager } from './toast-manager.js';
import AnimationManager, { getAnimationManager } from './animation-manager.js';
import AnalyticsManager, { getAnalyticsManager } from './analytics-manager.js';

class NoahsArkApp {
    constructor() {
        // App state
        this.isInitialized = false;
        this.managers = new Map();
        this.modules = new Map();
        this.loadStartTime = performance.now();
        
        // Core configuration
        this.config = {
            name: CONFIG.business.name,
            version: CONFIG.version,
            environment: CONFIG.isDevelopment ? 'development' : 'production',
            features: {
                navigation: true,
                menu: true,
                cart: true,
                forms: true,
                analytics: true,
                animations: true,
                notifications: true,
                serviceWorker: true,
                offline: true
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log(`🚀 Initializing ${this.config.name} v${this.config.version}`);
            
            // Phase 1: Critical setup
            await this.setupCriticalServices();
            
            // Phase 2: Core managers
            await this.initializeManagers();
            
            // Phase 3: Enhanced features
            await this.initializeFeatures();
            
            // Phase 4: Finalization
            await this.finalize();
            
            this.isInitialized = true;
            this.trackAppReady();
            
            console.log(`✅ ${this.config.name} initialized in ${Math.round(performance.now() - this.loadStartTime)}ms`);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    async setupCriticalServices() {
        // Error handling
        this.setupErrorHandling();
        
        // Check browser compatibility
        this.checkBrowserSupport();
        
        // Initialize analytics first (for tracking init process)
        if (this.config.features.analytics) {
            this.managers.set('analytics', getAnalyticsManager());
            this.track('app_init_started');
        }
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Initialize toast system early
        if (this.config.features.notifications) {
            this.managers.set('toast', getToastManager());
        }
    }
    
    async initializeManagers() {
        const managers = [];
        
        // Navigation (critical for UX)
        if (this.config.features.navigation) {
            managers.push({
                name: 'navigation',
                factory: () => new NavigationManager(),
                critical: true
            });
        }
        
        // Animations (affects perceived performance)
        if (this.config.features.animations) {
            managers.push({
                name: 'animation',
                factory: () => getAnimationManager(),
                critical: false
            });
        }
        
        // Menu system
        if (this.config.features.menu) {
            managers.push({
                name: 'menu',
                factory: () => new MenuManager(),
                critical: true
            });
        }
        
        // Shopping cart
        if (this.config.features.cart) {
            managers.push({
                name: 'cart',
                factory: () => new CartManager(),
                critical: true
            });
        }
        
        // Form handling
        if (this.config.features.forms) {
            managers.push({
                name: 'forms',
                factory: () => new FormManager(),
                critical: false
            });
        }
        
        // Initialize in order of criticality
        const criticalManagers = managers.filter(m => m.critical);
        const nonCriticalManagers = managers.filter(m => !m.critical);
        
        // Critical managers - sequential
        for (const manager of criticalManagers) {
            await this.initializeManager(manager);
        }
        
        // Non-critical managers - parallel
        await Promise.all(
            nonCriticalManagers.map(manager => this.initializeManager(manager))
        );
    }
    
    async initializeManager(managerConfig) {
        try {
            const startTime = performance.now();
            const manager = managerConfig.factory();
            
            this.managers.set(managerConfig.name, manager);
            
            const initTime = Math.round(performance.now() - startTime);
            console.log(`✓ ${managerConfig.name} manager ready (${initTime}ms)`);
            
            this.track('manager_initialized', {
                manager: managerConfig.name,
                init_time: initTime,
                critical: managerConfig.critical
            });
            
        } catch (error) {
            console.error(`Failed to initialize ${managerConfig.name}:`, error);
            
            if (managerConfig.critical) {
                throw error;
            } else {
                this.handleNonCriticalError(managerConfig.name, error);
            }
        }
    }
    
    async initializeFeatures() {
        const features = [];
        
        // Service Worker
        if (this.config.features.serviceWorker) {
            features.push(this.initializeServiceWorker());
        }
        
        // Offline support
        if (this.config.features.offline) {
            features.push(this.initializeOfflineSupport());
        }
        
        // PWA features
        features.push(this.initializePWA());
        
        // External integrations
        features.push(this.initializeIntegrations());
        
        // Wait for all features (non-blocking)
        const results = await Promise.allSettled(features);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`Feature ${index} failed:`, result.reason);
            }
        });
    }
    
    async finalize() {
        // Cross-manager connections
        this.connectManagers();
        
        // Global event bindings
        this.bindGlobalEvents();
        
        // Initial page setup
        this.setupInitialState();
        
        // Performance optimizations
        this.optimizePerformance();
        
        // Show welcome message if first visit
        this.handleFirstVisit();
    }
    
    connectManagers() {
        const managers = this.managers;
        
        // Make managers globally available
        if (typeof window !== 'undefined') {
            window.app = this;
            window.navigation = managers.get('navigation');
            window.menuManager = managers.get('menu');
            window.cartManager = managers.get('cart');
            window.formManager = managers.get('forms');
            window.toastManager = managers.get('toast');
            window.animationManager = managers.get('animation');
            window.analytics = managers.get('analytics');
        }
        
        // Cross-manager event connections
        this.setupManagerCommunication();
    }
    
    setupManagerCommunication() {
        const cart = this.managers.get('cart');
        const toast = this.managers.get('toast');
        const analytics = this.managers.get('analytics');
        
        // Cart to Toast notifications
        if (cart && toast) {
            this.interceptCartEvents(cart, toast);
        }
        
        // Form to Analytics tracking
        const forms = this.managers.get('forms');
        if (forms && analytics) {
            this.interceptFormEvents(forms, analytics);
        }
    }
    
    interceptCartEvents(cart, toast) {
        const originalAddItem = cart.addItem.bind(cart);
        cart.addItem = (...args) => {
            const result = originalAddItem(...args);
            if (result) {
                toast.success('Товар додано до кошика!');
            }
            return result;
        };
    }
    
    interceptFormEvents(forms, analytics) {
        // Listen for form events
        document.addEventListener('form-submitted', (e) => {
            analytics.track(ANALYTICS_EVENTS.FORM_SUBMITTED, {
                form_id: e.detail.formId,
                form_type: e.detail.type
            });
        });
    }
    
    bindGlobalEvents() {
        // Online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatusChange(false);
        });
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Resize events
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });
        
        // Phone number clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="tel:"]')) {
                this.track(ANALYTICS_EVENTS.PHONE_CALL, {
                    phone_number: e.target.getAttribute('href')
                });
            }
        });
    }
    
    setupInitialState() {
        // Check restaurant status
        this.updateRestaurantStatus();
        
        // Handle URL hash
        if (window.location.hash) {
            this.handleInitialHash();
        }
        
        // Trigger initial animations
        this.triggerInitialAnimations();
        
        // Check for promotional campaigns
        this.checkPromotionalCampaigns();
    }
    
    async initializeServiceWorker() {
        if (!('serviceWorker' in navigator) || this.config.environment === 'development') {
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✓ Service Worker registered');
            
            registration.addEventListener('updatefound', () => {
                this.handleServiceWorkerUpdate(registration);
            });
            
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }
    
    async initializeOfflineSupport() {
        // Store critical resources
        const criticalResources = [
            '/',
            '/css/styles.css',
            '/js/app.js',
            '/images/logo.svg'
        ];
        
        if ('caches' in window) {
            try {
                const cache = await caches.open('noahs-ark-v1');
                await cache.addAll(criticalResources);
                console.log('✓ Offline resources cached');
            } catch (error) {
                console.warn('Failed to cache offline resources:', error);
            }
        }
    }
    
    async initializePWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Handle app installed
        window.addEventListener('appinstalled', () => {
            this.track('pwa_installed');
            this.managers.get('toast')?.success('Додаток встановлено!');
        });
    }
    
    async initializeIntegrations() {
        // Google Maps for delivery
        if (CONFIG.maps?.googleMapsApiKey) {
            await this.loadGoogleMaps();
        }
        
        // External payment systems
        if (CONFIG.payments?.enabled) {
            await this.initializePayments();
        }
    }
    
    // === EVENT HANDLERS ===
    
    handleOnlineStatusChange(isOnline) {
        const toast = this.managers.get('toast');
        
        if (isOnline) {
            toast?.success('З\'єднання відновлено');
            this.syncOfflineData();
        } else {
            toast?.warning('Відсутнє з\'єднання з інтернетом', {
                persistent: true
            });
        }
        
        this.track('connectivity_changed', { online: isOnline });
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseNonEssentialTasks();
        } else {
            this.resumeNonEssentialTasks();
        }
    }
    
    handleResize() {
        this.managers.forEach(manager => {
            if (manager.handleResize) {
                manager.handleResize();
            }
        });
    }
    
    handleBeforeUnload() {
        // Save any pending data
        this.saveAppState();
        
        // Flush analytics
        this.managers.get('analytics')?.flushQueue(true);
    }
    
    handleInitialHash() {
        const hash = window.location.hash.substring(1);
        const navigation = this.managers.get('navigation');
        
        if (navigation && hash) {
            setTimeout(() => {
                navigation.navigateToSection(hash, false);
            }, 500);
        }
    }
    
    // === UTILITY METHODS ===
    
    updateRestaurantStatus() {
        const isOpen = Utils.isRestaurantOpen();
        const statusElements = document.querySelectorAll('.restaurant-status');
        
        statusElements.forEach(element => {
            element.textContent = isOpen ? 'Відкрито' : 'Зачинено';
            element.className = `restaurant-status ${isOpen ? 'open' : 'closed'}`;
        });
        
        if (!isOpen) {
            const timeUntilOpen = Utils.getTimeUntilOpen();
            this.managers.get('toast')?.info(
                `Ресторан зачинено. Відкриємося через ${timeUntilOpen.hours}г ${timeUntilOpen.minutes}хв`
            );
        }
    }
    
    triggerInitialAnimations() {
        const animation = this.managers.get('animation');
        if (!animation) return;
        
        // Hero section animation
        const heroElements = document.querySelectorAll('.hero-content > *');
        if (heroElements.length > 0) {
            animation.staggerIn(heroElements, 'slideInUp', { staggerDelay: 200 });
        }
        
        // Stats counter animation
        const counters = document.querySelectorAll('[data-counter]');
        counters.forEach(counter => {
            animation.addScrollElement(counter);
        });
    }
    
    checkPromotionalCampaigns() {
        const campaigns = StorageUtils.get('promotional_campaigns') || [];
        const activeCampaign = campaigns.find(c => {
            const now = Date.now();
            return now >= c.startDate && now <= c.endDate && !c.dismissed;
        });
        
        if (activeCampaign) {
            this.showPromotionalBanner(activeCampaign);
        }
    }
    
    showPromotionalBanner(campaign) {
        const toast = this.managers.get('toast');
        toast?.show(campaign.message, 'info', {
            duration: 10000,
            title: campaign.title,
            actions: [{
                id: 'dismiss',
                text: 'Закрити',
                callback: () => {
                    campaign.dismissed = true;
                    StorageUtils.set('promotional_campaigns', 
                        StorageUtils.get('promotional_campaigns'));
                }
            }]
        });
    }
    
    showInstallPrompt() {
        if (!this.deferredPrompt) return;
        
        const toast = this.managers.get('toast');
        toast?.show('Встановити додаток для швидкого доступу?', 'info', {
            duration: 15000,
            actions: [
                {
                    id: 'install',
                    text: 'Встановити',
                    callback: () => this.installPWA()
                },
                {
                    id: 'later',
                    text: 'Пізніше',
                    callback: () => {
                        StorageUtils.set('install_prompt_dismissed', Date.now());
                    }
                }
            ]
        });
    }
    
    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.userChoice;
        
        this.track('pwa_install_prompt', {
            outcome: result.outcome
        });
        
        this.deferredPrompt = null;
    }
    
    // === ERROR HANDLING ===
    
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            this.handleError(e.error, 'javascript_error');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError(e.reason, 'unhandled_promise');
        });
    }
    
    handleError(error, type = 'unknown') {
        console.error(`App Error (${type}):`, error);
        
        // Track error
        this.track('app_error', {
            error_type: type,
            error_message: error?.message || 'Unknown error',
            error_stack: error?.stack
        });
        
        // Show user-friendly message
        const toast = this.managers.get('toast');
        if (toast && !CONFIG.isDevelopment) {
            toast.error('Виникла технічна помилка. Спробуйте оновити сторінку.');
        }
    }
    
    handleInitializationError(error) {
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
                <h1>Помилка завантаження</h1>
                <p>Не вдалося ініціалізувати додаток. Спробуйте оновити сторінку.</p>
                <button onclick="location.reload()" style="
                    padding: 0.5rem 1rem; 
                    background: #D2001F; 
                    color: white; 
                    border: none; 
                    border-radius: 4px;
                    cursor: pointer;
                ">Оновити сторінку</button>
            </div>
        `;
    }
    
    handleNonCriticalError(managerName, error) {
        console.warn(`Non-critical manager ${managerName} failed:`, error);
        
        const toast = this.managers.get('toast');
        if (toast && CONFIG.isDevelopment) {
            toast.warning(`Помилка ініціалізації ${managerName}`);
        }
    }
    
    // === PERFORMANCE ===
    
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            this.observePerformanceMetrics();
        }
        
        // Track resource loading
        window.addEventListener('load', () => {
            this.trackResourcePerformance();
        });
    }
    
    observePerformanceMetrics() {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.track('performance_metric', {
                        metric_name: entry.name,
                        metric_value: entry.value,
                        metric_rating: entry.rating
                    });
                });
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        } catch (error) {
            console.warn('Performance observer failed:', error);
        }
    }
    
    trackResourcePerformance() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        
        this.track('page_performance', {
            load_time: navigation.loadEventEnd - navigation.fetchStart,
            dom_ready: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            resource_count: resources.length,
            cache_hit_ratio: resources.filter(r => r.transferSize === 0).length / resources.length
        });
    }
    
    optimizePerformance() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Setup intersection observers for lazy loading
        this.setupLazyLoading();
        
        // Optimize images
        this.optimizeImages();
    }
    
    preloadCriticalResources() {
        const criticalImages = [
            '/images/hero-shawarma.jpg',
            '/images/logo.svg'
        ];
        
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = src;
            link.as = 'image';
            document.head.appendChild(link);
        });
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }
    
    optimizeImages() {
        // Add loading="lazy" to images below fold
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach((img, index) => {
            if (index > 3) { // Skip first few images
                img.loading = 'lazy';
            }
        });
    }
    
    // === STATE MANAGEMENT ===
    
    saveAppState() {
        const state = {
            version: this.config.version,
            timestamp: Date.now(),
            managers: {}
        };
        
        // Save manager states
        this.managers.forEach((manager, name) => {
            if (manager.getState) {
                state.managers[name] = manager.getState();
            }
        });
        
        StorageUtils.set('app_state', state);
    }
    
    loadAppState() {
        const state = StorageUtils.get('app_state');
        if (!state || state.version !== this.config.version) {
            return null;
        }
        
        return state;
    }
    
    // === UTILITY METHODS ===
    
    checkBrowserSupport() {
        const required = [
            'fetch',
            'Promise',
            'Map',
            'Set',
            'addEventListener'
        ];
        
        const missing = required.filter(feature => !(feature in window));
        
        if (missing.length > 0) {
            console.warn('Missing browser features:', missing);
            this.showBrowserWarning();
        }
    }
    
    showBrowserWarning() {
        const banner = document.createElement('div');
        banner.innerHTML = `
            <div style="
                background: #ffeb3b; 
                color: #333; 
                padding: 1rem; 
                text-align: center;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
            ">
                Ваш браузер застарів. Для кращої роботи сайту рекомендуємо оновити браузер.
                <button onclick="this.parentElement.remove()" style="margin-left: 1rem;">✕</button>
            </div>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
    handleFirstVisit() {
        const isFirstVisit = !StorageUtils.get('has_visited');
        
        if (isFirstVisit) {
            StorageUtils.set('has_visited', true);
            
            setTimeout(() => {
                const toast = this.managers.get('toast');
                toast?.success('Ласкаво просимо до Ковчега Ноя! 🎉', {
                    duration: 5000,
                    title: 'Вітаємо!'
                });
            }, 2000);
            
            this.track('first_visit');
        }
    }
    
    syncOfflineData() {
        // Sync any offline data when connection is restored
        this.managers.forEach(manager => {
            if (manager.syncOfflineData) {
                manager.syncOfflineData();
            }
        });
    }
    
    pauseNonEssentialTasks() {
        this.managers.get('animation')?.pauseAllAnimations();
    }
    
    resumeNonEssentialTasks() {
        this.managers.get('animation')?.resumeAllAnimations();
    }
    
    // === PUBLIC API ===
    
    getManager(name) {
        return this.managers.get(name);
    }
    
    isReady() {
        return this.isInitialized;
    }
    
    getVersion() {
        return this.config.version;
    }
    
    track(event, properties = {}) {
        const analytics = this.managers.get('analytics');
        if (analytics) {
            analytics.track(event, {
                app_version: this.config.version,
                environment: this.config.environment,
                ...properties
            });
        }
    }
    
    trackAppReady() {
        const loadTime = Math.round(performance.now() - this.loadStartTime);
        
        this.track('app_ready', {
            load_time: loadTime,
            managers_count: this.managers.size,
            features_enabled: Object.entries(this.config.features)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
        });
    }
    
    // === DEBUG METHODS ===
    
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group(`🚀 ${this.config.name} Debug Info`);
        console.log('Version:', this.config.version);
        console.log('Environment:', this.config.environment);
        console.log('Initialized:', this.isInitialized);
        console.log('Load time:', Math.round(performance.now() - this.loadStartTime), 'ms');
        console.log('Active managers:', Array.from(this.managers.keys()));
        console.log('Features enabled:', this.config.features);
        console.groupEnd();
        
        // Debug individual managers
        this.managers.forEach(manager => {
            if (manager.debug) {
                manager.debug();
            }
        });
    }
    
    getStats() {
        return {
            version: this.config.version,
            environment: this.config.environment,
            initialized: this.isInitialized,
            loadTime: Math.round(performance.now() - this.loadStartTime),
            managersCount: this.managers.size,
            featuresEnabled: Object.entries(this.config.features)
                .filter(([_, enabled]) => enabled).length
        };
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Destroy all managers
        this.managers.forEach(manager => {
            if (manager.destroy) {
                manager.destroy();
            }
        });
        
        // Clear references
        this.managers.clear();
        this.modules.clear();
        
        console.log('🚀 App destroyed');
    }
}

// Auto-initialize when DOM is ready
let app;

function initializeApp() {
    if (app) return app;
    
    app = new NoahsArkApp();
    
    // Make globally available
    if (typeof window !== 'undefined') {
        window.NoahsArkApp = app;
        
        // Development helpers
        if (CONFIG.isDevelopment) {
            window.appDebug = () => app.debug();
            window.appStats = () => app.getStats();
        }
    }
    
    return app;
}

// Initialize based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

export default NoahsArkApp;
export { initializeApp };