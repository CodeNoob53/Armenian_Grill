// ===== TOAST-MANAGER.JS - СИСТЕМА СПОВІЩЕНЬ =====

import { Utils } from './utils.js';
import { CONFIG, NOTIFICATION_TYPES, MESSAGES } from './config.js';

export class ToastManager {
    constructor() {
        // State
        this.toasts = new Map();
        this.queue = [];
        this.isProcessingQueue = false;
        this.nextId = 1;
        
        // Configuration
        this.config = {
            maxVisible: CONFIG.notifications?.maxVisible || 5,
            defaultDuration: CONFIG.notifications?.defaultDuration || 5000,
            errorDuration: CONFIG.notifications?.errorDuration || 8000,
            position: 'top-right', // top-left, top-right, bottom-left, bottom-right, top-center, bottom-center
            enableSound: false,
            enableAnimations: true,
            enableSwipeToClose: true,
            stackDirection: 'down', // up, down
            pauseOnHover: true,
            enableProgress: true,
            enableActions: true
        };
        
        // DOM elements
        this.container = null;
        this.soundPlayer = null;
        
        // Interaction state
        this.isPaused = false;
        this.focusedToast = null;
        
        this.init();
    }
    
    init() {
        this.createContainer();
        this.bindGlobalEvents();
        this.setupSounds();
        this.loadQueueFromStorage();
        
        console.log('🍞 Toast Manager initialized');
    }
    
    createContainer() {
        // Remove existing container
        const existing = Utils.$('.toast-container');
        if (existing) {
            existing.remove();
        }
        
        this.container = Utils.createElement('div', {
            className: `toast-container toast-${this.config.position}`,
            id: 'toast-container',
            'aria-live': 'polite',
            'aria-atomic': 'false',
            role: 'region',
            'aria-label': 'Сповіщення'
        });
        
        document.body.appendChild(this.container);
    }
    
    bindGlobalEvents() {
        // Keyboard events for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.dismissAll();
            }
            
            // Arrow navigation through toasts
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                this.navigateToasts(e.key === 'ArrowUp' ? -1 : 1);
            }
        });
        
        // Page visibility change - pause/resume timers
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
        
        // Window focus events
        window.addEventListener('focus', () => {
            this.resumeAll();
        });
        
        window.addEventListener('blur', () => {
            this.pauseAll();
        });
        
        // Reduced motion preference
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.config.enableAnimations = false;
        }
        
        // Touch events for mobile swipe
        if (this.config.enableSwipeToClose && Utils.isTouchDevice()) {
            this.bindTouchEvents();
        }
    }
    
    bindTouchEvents() {
        let startX = 0;
        let startY = 0;
        let currentToast = null;
        
        Utils.on(this.container, 'touchstart', (e) => {
            const toast = e.target.closest('.toast');
            if (!toast) return;
            
            currentToast = toast;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        Utils.on(this.container, 'touchmove', (e) => {
            if (!currentToast) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const deltaX = currentX - startX;
            const deltaY = Math.abs(currentY - startY);
            
            // Only handle horizontal swipes
            if (deltaY > 50) {
                currentToast = null;
                return;
            }
            
            if (Math.abs(deltaX) > 20) {
                currentToast.style.transform = `translateX(${deltaX}px)`;
                currentToast.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
            }
        }, { passive: true });
        
        Utils.on(this.container, 'touchend', (e) => {
            if (!currentToast) return;
            
            const currentX = e.changedTouches[0].clientX;
            const deltaX = currentX - startX;
            
            if (Math.abs(deltaX) > 100) {
                // Swipe to dismiss
                const toastId = currentToast.dataset.toastId;
                this.dismiss(toastId);
            } else {
                // Snap back
                currentToast.style.transform = '';
                currentToast.style.opacity = '';
            }
            
            currentToast = null;
        }, { passive: true });
    }
    
    setupSounds() {
        if (!this.config.enableSound) return;
        
        this.soundPlayer = {
            success: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+bzu2coBC54z+PSmkILFn+v5tVhMLYh0c'),
            error: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+bzu2coBC54z+PSmkILFn+v5tVhMLYh0c'),
            warning: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+bzu2coBC54z+PSmkILFn+v5tVhMLYh0c'),
            info: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+bzu2coBC54z+PSmkILFn+v5tVhMLYh0c')
        };
    }
    
    loadQueueFromStorage() {
        const storedQueue = Utils.storage.get('toast_queue');
        if (storedQueue && Array.isArray(storedQueue)) {
            this.queue = storedQueue;
            this.processQueue();
        }
    }
    
    // === CORE TOAST CREATION ===
    
    show(message, type = NOTIFICATION_TYPES.INFO, options = {}) {
        const toastConfig = this.createToastConfig(message, type, options);
        
        // Check if we should queue or show immediately
        if (this.getVisibleCount() >= this.config.maxVisible) {
            this.addToQueue(toastConfig);
            return toastConfig.id;
        }
        
        return this.displayToast(toastConfig);
    }
    
    createToastConfig(message, type, options) {
        return {
            id: this.generateToastId(),
            message,
            type,
            title: options.title || null,