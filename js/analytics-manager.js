// ===== ANALYTICS-MANAGER.JS - СИСТЕМА ТРЕКІНГУ ТА АНАЛІТИКИ =====

import { Utils, StorageUtils } from './utils.js';
import { CONFIG, ANALYTICS_EVENTS } from './config.js';

export class AnalyticsManager {
    constructor() {
        // State
        this.isInitialized = false;
        this.providers = new Map();
        this.eventQueue = [];
        this.sessionData = {};
        this.userProperties = {};
        this.isOnline = navigator.onLine;
        
        // Configuration
        this.config = {
            enabledProviders: ['google', 'facebook', 'internal'],
            batchSize: 10,
            flushInterval: 30000, // 30 seconds
            maxRetries: 3,
            enableDebug: CONFIG.isDevelopment,
            enableConsent: true,
            anonymizeIP: true,
            cookieExpiry: 365,
            enableEcommerce: true,
            enableUserTiming: true
        };
        
        // Privacy and consent
        this.consentGiven = false;
        this.consentLevel = 'none'; // none, functional, analytics, marketing, all
        
        this.init();
    }
    
    init() {
        this.setupSession();
        this.checkConsent();
        this.initializeProviders();
        this.bindEvents();
        this.startBatchProcessor();
        this.trackPageView();
        
        this.isInitialized = true;
        console.log('📊 Analytics Manager initialized');
    }
    
    setupSession() {
        this.sessionData = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            deviceType: Utils.getDeviceType(),
            isReturning: this.isReturningUser()
        };
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    isReturningUser() {
        const lastVisit = StorageUtils.get('analytics_last_visit');
        if (lastVisit) {
            StorageUtils.set('analytics_last_visit', Date.now());
            return true;
        } else {
            StorageUtils.set('analytics_last_visit', Date.now());
            return false;
        }
    }
    
    checkConsent() {
        const storedConsent = StorageUtils.get('analytics_consent');
        if (storedConsent) {
            this.consentGiven = storedConsent.given;
            this.consentLevel = storedConsent.level;
        } else if (!this.config.enableConsent) {
            // Auto-consent if consent management is disabled
            this.consentGiven = true;
            this.consentLevel = 'all';
        }
    }
    
    initializeProviders() {
        // Google Analytics 4
        if (this.shouldInitializeProvider('google')) {
            this.initGoogleAnalytics();
        }
        
        // Facebook Pixel
        if (this.shouldInitializeProvider('facebook')) {
            this.initFacebookPixel();
        }
        
        // Internal analytics
        if (this.shouldInitializeProvider('internal')) {
            this.initInternalAnalytics();
        }
        
        // Hotjar
        if (this.shouldInitializeProvider('hotjar')) {
            this.initHotjar();
        }
    }
    
    shouldInitializeProvider(provider) {
        return this.config.enabledProviders.includes(provider) && 
               this.consentGiven && 
               (this.consentLevel === 'all' || 
                (this.consentLevel === 'analytics' && ['google', 'internal'].includes(provider)) ||
                (this.consentLevel === 'marketing' && ['facebook', 'hotjar'].includes(provider)));
    }
    
    initGoogleAnalytics() {
        const gaId = CONFIG.analytics?.googleAnalyticsId;
        if (!gaId) return;
        
        // Load gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        
        gtag('js', new Date());
        gtag('config', gaId, {
            anonymize_ip: this.config.anonymizeIP,
            cookie_expires: this.config.cookieExpiry * 24 * 60 * 60,
            enable_auto_tracking: false // We'll handle tracking manually
        });
        
        this.providers.set('google', {
            id: gaId,
            ready: true,
            track: this.trackGoogleEvent.bind(this)
        });
        
        console.log('📊 Google Analytics initialized');
    }
    
    initFacebookPixel() {
        const pixelId = CONFIG.analytics?.facebookPixelId;
        if (!pixelId) return;
        
        // Load Facebook Pixel
        !function(f,b,e,v,n,t,s) {
            if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
        }(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', pixelId);
        fbq('track', 'PageView');
        
        this.providers.set('facebook', {
            id: pixelId,
            ready: true,
            track: this.trackFacebookEvent.bind(this)
        });
        
        console.log('📊 Facebook Pixel initialized');
    }
    
    initInternalAnalytics() {
        this.providers.set('internal', {
            ready: true,
            track: this.trackInternalEvent.bind(this),
            endpoint: CONFIG.analytics?.internalEndpoint || '/api/analytics'
        });
        
        console.log('📊 Internal Analytics initialized');
    }
    
    initHotjar() {
        const hotjarId = CONFIG.analytics?.hotjarId;
        if (!hotjarId) return;
        
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:hotjarId,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        
        this.providers.set('hotjar', {
            id: hotjarId,
            ready: true
        });
        
        console.log('📊 Hotjar initialized');
    }
    
    bindEvents() {
        // Online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Page unload - flush remaining events
        window.addEventListener('beforeunload', () => {
            this.flushQueue(true);
            this.trackSessionEnd();
        });
        
        // Error tracking
        window.addEventListener('error', (e) => {
            this.trackError({
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError({
                type: 'unhandled_promise',
                reason: e.reason?.toString() || 'Unknown promise rejection'
            });
        });
        
        // Performance monitoring
        if (this.config.enableUserTiming) {
            this.setupPerformanceTracking();
        }
        
        // Auto-track common interactions
        this.setupAutoTracking();
    }
    
    setupPerformanceTracking() {
        // Track Core Web Vitals
        if ('web-vitals' in window) {
            this.trackWebVitals();
        }
        
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.trackPagePerformance();
            }, 0);
        });
    }
    
    setupAutoTracking() {
        // Track clicks on important elements
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-track], .track-click');
            if (element) {
                this.trackElementClick(element, e);
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form[data-track]')) {
                this.trackFormSubmission(e.target);
            }
        });
        
        // Track scroll depth
        this.setupScrollTracking();
        
        // Track time on page
        this.setupTimeTracking();
    }
    
    setupScrollTracking() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const tracked = new Set();
        
        const handleScroll = Utils.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.track(ANALYTICS_EVENTS.SCROLL_DEPTH, {
                        depth_percentage: milestone,
                        page_url: window.location.href
                    });
                }
            });
        }, 250);
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Track max scroll on page unload
        window.addEventListener('beforeunload', () => {
            if (maxScroll > 0) {
                this.track(ANALYTICS_EVENTS.MAX_SCROLL, {
                    max_scroll_percentage: maxScroll
                });
            }
        });
    }
    
    setupTimeTracking() {
        let timeOnPage = 0;
        let isActive = true;
        let startTime = Date.now();
        
        const trackTime = () => {
            if (isActive) {
                timeOnPage += Date.now() - startTime;
            }
            startTime = Date.now();
        };
        
        // Track active/inactive states
        document.addEventListener('visibilitychange', () => {
            trackTime();
            isActive = !document.hidden;
        });
        
        window.addEventListener('focus', () => {
            isActive = true;
            startTime = Date.now();
        });
        
        window.addEventListener('blur', () => {
            trackTime();
            isActive = false;
        });
        
        // Send time data periodically
        setInterval(() => {
            trackTime();
            if (timeOnPage > 0) {
                this.track(ANALYTICS_EVENTS.TIME_ON_PAGE, {
                    time_seconds: Math.round(timeOnPage / 1000),
                    page_url: window.location.href
                });
            }
        }, 30000); // Every 30 seconds
    }
    
    startBatchProcessor() {
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushQueue();
            }
        }, this.config.flushInterval);
    }
    
    // === CORE TRACKING METHODS ===
    
    track(eventName, properties = {}, options = {}) {
        if (!this.consentGiven) return;
        
        const event = this.createEvent(eventName, properties, options);
        
        if (this.config.enableDebug) {
            console.log('📊 Analytics Event:', event);
        }
        
        // Add to queue for batch processing
        this.eventQueue.push(event);
        
        // Immediate send for critical events
        if (options.immediate || this.isCriticalEvent(eventName)) {
            this.sendEvent(event);
        }
        
        // Check if queue needs flushing
        if (this.eventQueue.length >= this.config.batchSize) {
            this.flushQueue();
        }
        
        this.sessionData.events++;
    }
    
    createEvent(eventName, properties, options) {
        return {
            id: Utils.generateId('event'),
            name: eventName,
            properties: {
                ...this.getDefaultProperties(),
                ...properties
            },
            timestamp: Date.now(),
            session_id: this.sessionData.id,
            user_properties: this.userProperties,
            immediate: options.immediate || false,
            retries: 0
        };
    }
    
    getDefaultProperties() {
        return {
            page_url: window.location.href,
            page_title: document.title,
            page_referrer: document.referrer,
            user_agent: navigator.userAgent,
            language: navigator.language,
            screen_resolution: this.sessionData.screenResolution,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            device_type: this.sessionData.deviceType,
            timestamp: Date.now(),
            session_duration: Date.now() - this.sessionData.startTime
        };
    }
    
    isCriticalEvent(eventName) {
        const criticalEvents = [
            ANALYTICS_EVENTS.ORDER_COMPLETED,
            ANALYTICS_EVENTS.FORM_SUBMITTED,
            ANALYTICS_EVENTS.ERROR
        ];
        return criticalEvents.includes(eventName);
    }
    
    sendEvent(event) {
        this.providers.forEach((provider, name) => {
            if (provider.ready && provider.track) {
                try {
                    provider.track(event);
                } catch (error) {
                    console.warn(`Failed to send event to ${name}:`, error);
                }
            }
        });
    }
    
    flushQueue(sync = false) {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        if (sync) {
            // Synchronous send for page unload
            this.sendEventsBatch(events, true);
        } else {
            // Asynchronous send
            this.sendEventsBatch(events, false);
        }
    }
    
    sendEventsBatch(events, sync = false) {
        events.forEach(event => this.sendEvent(event));
        
        // Also send to internal analytics as batch
        const internalProvider = this.providers.get('internal');
        if (internalProvider && this.isOnline) {
            this.sendToInternal(events, sync);
        }
    }
    
    // === PROVIDER-SPECIFIC TRACKING ===
    
    trackGoogleEvent(event) {
        if (typeof gtag === 'undefined') return;
        
        gtag('event', event.name, {
            event_category: event.properties.category || 'engagement',
            event_label: event.properties.label,
            value: event.properties.value,
            custom_parameter_1: event.properties.custom_1,
            custom_parameter_2: event.properties.custom_2,
            ...event.properties
        });
    }
    
    trackFacebookEvent(event) {
        if (typeof fbq === 'undefined') return;
        
        // Map to Facebook standard events
        const fbEventMap = {
            [ANALYTICS_EVENTS.ADD_TO_CART]: 'AddToCart',
            [ANALYTICS_EVENTS.CHECKOUT_STARTED]: 'InitiateCheckout',
            [ANALYTICS_EVENTS.ORDER_COMPLETED]: 'Purchase',
            [ANALYTICS_EVENTS.PAGE_VIEW]: 'PageView'
        };
        
        const fbEventName = fbEventMap[event.name] || 'CustomEvent';
        
        if (fbEventName === 'CustomEvent') {
            fbq('trackCustom', event.name, event.properties);
        } else {
            fbq('track', fbEventName, event.properties);
        }
    }
    
    trackInternalEvent(event) {
        // Store in localStorage for later sending
        const stored = StorageUtils.get('analytics_internal_queue') || [];
        stored.push(event);
        StorageUtils.set('analytics_internal_queue', stored.slice(-100)); // Keep last 100
    }
    
    sendToInternal(events, sync = false) {
        const endpoint = this.providers.get('internal').endpoint;
        
        const data = {
            events,
            session: this.sessionData,
            timestamp: Date.now()
        };
        
        if (sync && navigator.sendBeacon) {
            // Use sendBeacon for reliable delivery during page unload
            navigator.sendBeacon(endpoint, JSON.stringify(data));
        } else {
            // Regular async request
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(error => {
                console.warn('Failed to send internal analytics:', error);
                // Add back to queue for retry
                this.eventQueue.unshift(...events);
            });
        }
    }
    
    // === SPECIALIZED TRACKING METHODS ===
    
    trackPageView(url = window.location.href) {
        this.sessionData.pageViews++;
        
        this.track(ANALYTICS_EVENTS.PAGE_VIEW, {
            page_url: url,
            page_title: document.title,
            page_location: url,
            page_referrer: document.referrer
        }, { immediate: true });
    }
    
    trackElementClick(element, event) {
        const data = {
            element_id: element.id,
            element_class: element.className,
            element_text: element.textContent?.substring(0, 100),
            element_tag: element.tagName.toLowerCase(),
            click_x: event.clientX,
            click_y: event.clientY
        };
        
        // Custom tracking data from attributes
        if (element.dataset.track) {
            data.custom_action = element.dataset.track;
        }
        
        if (element.dataset.trackCategory) {
            data.category = element.dataset.trackCategory;
        }
        
        this.track(ANALYTICS_EVENTS.ELEMENT_CLICK, data);
    }
    
    trackFormSubmission(form) {
        this.track(ANALYTICS_EVENTS.FORM_SUBMITTED, {
            form_id: form.id,
            form_action: form.action,
            form_method: form.method,
            field_count: form.elements.length
        });
    }
    
    trackError(error) {
        this.track(ANALYTICS_EVENTS.ERROR, {
            error_message: error.message,
            error_type: error.type || 'javascript',
            error_filename: error.filename,
            error_line: error.lineno,
            error_column: error.colno,
            error_stack: error.stack?.substring(0, 1000), // Limit stack trace
            user_agent: navigator.userAgent,
            page_url: window.location.href
        }, { immediate: true });
    }
    
    trackPagePerformance() {
        if (!performance || !performance.timing) return;
        
        const timing = performance.timing;
        const navigation = performance.navigation;
        
        const metrics = {
            dns_time: timing.domainLookupEnd - timing.domainLookupStart,
            connect_time: timing.connectEnd - timing.connectStart,
            request_time: timing.responseStart - timing.requestStart,
            response_time: timing.responseEnd - timing.responseStart,
            dom_processing_time: timing.domContentLoadedEventStart - timing.responseEnd,
            total_load_time: timing.loadEventEnd - timing.navigationStart,
            navigation_type: navigation.type,
            redirect_count: navigation.redirectCount
        };
        
        this.track(ANALYTICS_EVENTS.PAGE_PERFORMANCE, metrics);
    }
    
    trackWebVitals() {
        // This would integrate with web-vitals library if available
        if (typeof webVitals !== 'undefined') {
            webVitals.getCLS((metric) => {
                this.track('web_vital_cls', { value: metric.value });
            });
            
            webVitals.getFID((metric) => {
                this.track('web_vital_fid', { value: metric.value });
            });
            
            webVitals.getLCP((metric) => {
                this.track('web_vital_lcp', { value: metric.value });
            });
        }
    }
    
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionData.startTime;
        
        this.track(ANALYTICS_EVENTS.SESSION_END, {
            session_duration: sessionDuration,
            page_views: this.sessionData.pageViews,
            events_count: this.sessionData.events
        }, { immediate: true });
    }
    
    // === E-COMMERCE TRACKING ===
    
    trackPurchase(transactionData) {
        if (!this.config.enableEcommerce) return;
        
        this.track(ANALYTICS_EVENTS.ORDER_COMPLETED, {
            transaction_id: transactionData.id,
            value: transactionData.total,
            currency: transactionData.currency || 'UAH',
            items: transactionData.items,
            payment_method: transactionData.paymentMethod,
            shipping_method: transactionData.shippingMethod
        }, { immediate: true });
        
        // Enhanced ecommerce for Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: transactionData.id,
                value: transactionData.total,
                currency: transactionData.currency || 'UAH',
                items: transactionData.items.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    price: item.price
                }))
            });
        }
    }
    
    trackAddToCart(item) {
        this.track(ANALYTICS_EVENTS.ADD_TO_CART, {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity || 1
        });
    }
    
    trackRemoveFromCart(item) {
        this.track(ANALYTICS_EVENTS.REMOVE_FROM_CART, {
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity || 1
        });
    }
    
    // === USER IDENTIFICATION ===
    
    setUserId(userId) {
        this.userProperties.user_id = userId;
        
        // Update in all providers
        if (typeof gtag !== 'undefined') {
            gtag('config', this.providers.get('google')?.id, {
                user_id: userId
            });
        }
        
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', { user_id: userId });
        }
    }
    
    setUserProperties(properties) {
        this.userProperties = { ...this.userProperties, ...properties };
        
        // Update in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('set', { user_properties: properties });
        }
    }
    
    // === CONSENT MANAGEMENT ===
    
    setConsent(given, level = 'all') {
        this.consentGiven = given;
        this.consentLevel = level;
        
        StorageUtils.set('analytics_consent', {
            given,
            level,
            timestamp: Date.now()
        });
        
        if (given && !this.isInitialized) {
            this.initializeProviders();
        } else if (!given) {
            this.clearTrackingData();
        }
        
        // Update provider consent
        this.updateProviderConsent();
    }
    
    updateProviderConsent() {
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: this.consentLevel === 'all' || this.consentLevel === 'analytics' ? 'granted' : 'denied',
                ad_storage: this.consentLevel === 'all' || this.consentLevel === 'marketing' ? 'granted' : 'denied'
            });
        }
    }
    
    clearTrackingData() {
        // Clear stored analytics data
        StorageUtils.remove('analytics_internal_queue');
        
        // Clear cookies (basic implementation)
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            if (name.includes('_ga') || name.includes('_fb')) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
        });
    }
    
    // === UTILITY METHODS ===
    
    getSessionData() {
        return { ...this.sessionData };
    }
    
    getUserProperties() {
        return { ...this.userProperties };
    }
    
    getQueueSize() {
        return this.eventQueue.length;
    }
    
    // === CONFIGURATION ===
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Reinitialize providers if needed
        if (newConfig.enabledProviders) {
            this.initializeProviders();
        }
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Flush remaining events
        this.flushQueue(true);
        
        // Clear intervals
        clearInterval(this.batchProcessor);
        
        // Clear references
        this.providers.clear();
        this.eventQueue = [];
        
        console.log('📊 Analytics Manager destroyed');
    }
    
    // === DEBUG METHODS ===
    
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group('📊 Analytics Manager Debug');
        console.log('Consent given:', this.consentGiven);
        console.log('Consent level:', this.consentLevel);
        console.log('Active providers:', Array.from(this.providers.keys()));
        console.log('Queue size:', this.eventQueue.length);
        console.log('Session data:', this.sessionData);
        console.log('User properties:', this.userProperties);
        console.groupEnd();
    }
}

// Analytics utility functions
export class AnalyticsUtils {
    /**
     * Track custom conversion
     */
    static trackConversion(name, value = 0, properties = {}) {
        window.analytics?.track(`conversion_${name}`, {
            conversion_value: value,
            currency: 'UAH',
            ...properties
        });
    }
    
    /**
     * Track A/B test participation
     */
    static trackExperiment(experimentName, variant, properties = {}) {
        window.analytics?.track('experiment_viewed', {
            experiment_name: experimentName,
            experiment_variant: variant,
            ...properties
        });
    }
    
    /**
     * Track feature usage
     */
    static trackFeatureUsage(feature, action, properties = {}) {
        window.analytics?.track('feature_used', {
            feature_name: feature,
            feature_action: action,
            ...properties
        });
    }
    
    /**
     * Track social sharing
     */
    static trackSocialShare(platform, url, content) {
        window.analytics?.track('social_share', {
            platform,
            shared_url: url,
            content_type: content.type,
            content_id: content.id,
            content_title: content.title
        });
    }
}

// Global analytics manager instance
let analyticsManagerInstance = null;

export function getAnalyticsManager() {
    if (!analyticsManagerInstance) {
        analyticsManagerInstance = new AnalyticsManager();
        
        if (typeof window !== 'undefined') {
            window.analytics = analyticsManagerInstance;
        }
    }
    
    return analyticsManagerInstance;
}

export function initAnalyticsManager(config = {}) {
    const manager = getAnalyticsManager();
    manager.updateConfig(config);
    return manager;
}

// Auto-initialize
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    getAnalyticsManager();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        getAnalyticsManager();
    });
}

export default AnalyticsManager;