// ===== UTILS.JS - УТИЛІТИ ТА ДОПОМІЖНІ ФУНКЦІЇ =====

import { CONFIG, VALIDATION_RULES } from './config.js';

// Основний клас утиліт
export class Utils {
    // ===== DOM MANIPULATION =====
    
    static $(selector) {
        return document.querySelector(selector);
    }
    
    static $$(selector) {
        return document.querySelectorAll(selector);
    }
    
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }
    
    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    static insertAfter(newElement, targetElement) {
        targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
    }
    
    static insertBefore(newElement, targetElement) {
        targetElement.parentNode.insertBefore(newElement, targetElement);
    }
    
    // ===== EVENT HANDLING =====
    
    static on(element, event, handler, options = {}) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }
    
    static off(element, event, handler) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.removeEventListener(event, handler);
        }
    }
    
    static once(element, event, handler) {
        this.on(element, event, handler, { once: true });
    }
    
    static delegate(parent, selector, event, handler) {
        this.on(parent, event, (e) => {
            if (e.target.matches(selector)) {
                handler.call(e.target, e);
            }
        });
    }
    
    static triggerEvent(element, eventType, data = {}) {
        const event = new CustomEvent(eventType, { 
            detail: data,
            bubbles: true,
            cancelable: true 
        });
        element.dispatchEvent(event);
    }
    
    // ===== PERFORMANCE UTILITIES =====
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    static raf(callback) {
        return requestAnimationFrame(callback);
    }
    
    static cancelRaf(id) {
        cancelAnimationFrame(id);
    }
    
    // ===== STRING UTILITIES =====
    
    static formatPrice(price) {
        return `${price} ₴`;
    }
    
    static formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 12 && cleaned.startsWith('380')) {
            return `+38 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
        }
        return phone;
    }
    
    static formatPhoneInput(value) {
        const digits = value.replace(/\D/g, '');
        
        if (digits.length >= 10) {
            const formatted = digits.startsWith('380') ? digits : '380' + digits.slice(-9);
            return `+38 (${formatted.slice(2, 5)}) ${formatted.slice(5, 8)}-${formatted.slice(8, 10)}-${formatted.slice(10, 12)}`;
        }
        
        return value;
    }
    
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }
    
    static stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    // ===== NUMBER UTILITIES =====
    
    static formatNumber(num, locale = 'uk-UA') {
        return new Intl.NumberFormat(locale).format(num);
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static roundTo(num, decimals) {
        return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
    }
    
    // ===== DATE/TIME UTILITIES =====
    
    static getCurrentTime() {
        return new Date().toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static getCurrentDate() {
        return new Date().toLocaleDateString('uk-UA');
    }
    
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('uk-UA', { ...defaultOptions, ...options }).format(date);
    }
    
    static isRestaurantOpen() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const openTime = 9 * 60; // 09:00
        const closeTime = 23 * 60; // 23:00
        
        return currentTime >= openTime && currentTime < closeTime;
    }
    
    static getTimeUntilOpen() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return { hours, minutes };
    }
    
    // ===== VALIDATION UTILITIES =====
    
    static validateEmail(email) {
        return VALIDATION_RULES.email.pattern.test(email);
    }
    
    static validatePhone(phone) {
        return VALIDATION_RULES.phone.pattern.test(phone);
    }
    
    static validateName(name) {
        return VALIDATION_RULES.name.pattern.test(name);
    }
    
    static validateField(field, value) {
        const rules = VALIDATION_RULES[field];
        if (!rules) return { isValid: true };
        
        if (rules.pattern && !rules.pattern.test(value)) {
            return { isValid: false, message: rules.message };
        }
        
        if (rules.minLength && value.length < rules.minLength) {
            return { isValid: false, message: `Мінімум ${rules.minLength} символів` };
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            return { isValid: false, message: `Максимум ${rules.maxLength} символів` };
        }
        
        return { isValid: true };
    }
    
    // ===== SCROLL UTILITIES =====
    
    static scrollTo(element, offset = CONFIG.ui.scrollOffset) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            const top = element.offsetTop - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    }
    
    static scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    static getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }
    
    static isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }
    
    // ===== URL UTILITIES =====
    
    static getUrlParams() {
        return new URLSearchParams(window.location.search);
    }
    
    static setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    }
    
    static removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    }
    
    // ===== DEVICE DETECTION =====
    
    static isMobile() {
        return window.innerWidth <= CONFIG.ui.mobileBreakpoint;
    }
    
    static isTablet() {
        return window.innerWidth > CONFIG.ui.mobileBreakpoint && 
               window.innerWidth <= CONFIG.ui.tabletBreakpoint;
    }
    
    static isDesktop() {
        return window.innerWidth > CONFIG.ui.tabletBreakpoint;
    }
    
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    static getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }
    
    // ===== GEOLOCATION UTILITIES =====
    
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        return d;
    }
    
    static deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    static async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                error => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    // ===== UTILITY FUNCTIONS =====
    
    static generateId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    }
    
    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }
    
    static isEmpty(value) {
        if (value == null) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
    
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static retry(fn, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attempt = (n) => {
                fn().then(resolve).catch((error) => {
                    if (n === 1) {
                        reject(error);
                    } else {
                        setTimeout(() => attempt(n - 1), delay);
                    }
                });
            };
            attempt(retries);
        });
    }
}

// ===== STORAGE UTILITIES =====
export class StorageUtils {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return false;
        }
    }
    
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('Error reading from localStorage:', e);
            return null;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Error removing from localStorage:', e);
            return false;
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.warn('Error clearing localStorage:', e);
            return false;
        }
    }
    
    static exists(key) {
        return localStorage.getItem(key) !== null;
    }
    
    static getSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }
    
    static setWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        };
        this.set(key, item);
    }
    
    static getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
            return null;
        }
    }
}

// ===== API UTILITIES =====
export class ApiUtils {
    static async request(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    static get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        
        return this.request(url.toString());
    }
    
    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    static put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    static upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    }
}

// ===== COOKIES UTILITIES =====
export class CookieUtils {
    static set(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    static get(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    static remove(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
    }
    
    static exists(name) {
        return this.get(name) !== null;
    }
}

// ===== PERFORMANCE UTILITIES =====
export class PerformanceUtils {
    static measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
    
    static async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
    
    static startTimer(name) {
        performance.mark(`${name}-start`);
    }
    
    static endTimer(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`${name} took ${measure.duration} milliseconds`);
        return measure.duration;
    }
    
    static getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
        return null;
    }
}

// ===== COLOR UTILITIES =====
export class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    static lighten(color, percent) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const factor = percent / 100;
        return this.rgbToHex(
            Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
            Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
            Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor))
        );
    }
    
    static darken(color, percent) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const factor = 1 - (percent / 100);
        return this.rgbToHex(
            Math.round(rgb.r * factor),
            Math.round(rgb.g * factor),
            Math.round(rgb.b * factor)
        );
    }
}

// Експорт всіх утиліт
export default {
    Utils,
    StorageUtils,
    ApiUtils,
    CookieUtils,
    PerformanceUtils,
    ColorUtils
};