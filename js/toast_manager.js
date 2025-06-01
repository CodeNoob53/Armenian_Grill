// ===== TOAST-MANAGER.JS - УПРАВЛІННЯ СПОВІЩЕННЯМИ =====

// Core utilities and configuration
import { Utils } from './utils.js';
import { CONFIG, MESSAGES, ANALYTICS_EVENTS } from './config.js';

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
            description: options.description || null,
            duration: options.duration || this.getDurationForType(type),
            persistent: options.persistent || false,
            actions: options.actions || [],
            icon: options.icon || this.getIconForType(type),
            customClass: options.customClass || '',
            data: options.data || {},
            createdAt: Date.now(),
            priority: options.priority || this.getPriorityForType(type)
        };
    }
    
    generateToastId() {
        return `toast_${this.nextId++}_${Date.now()}`;
    }
    
    getDurationForType(type) {
        switch (type) {
            case NOTIFICATION_TYPES.ERROR:
                return this.config.errorDuration;
            case NOTIFICATION_TYPES.WARNING:
                return this.config.errorDuration;
            case NOTIFICATION_TYPES.SUCCESS:
                return this.config.defaultDuration;
            case NOTIFICATION_TYPES.INFO:
            default:
                return this.config.defaultDuration;
        }
    }
    
    getIconForType(type) {
        const icons = {
            [NOTIFICATION_TYPES.SUCCESS]: '✅',
            [NOTIFICATION_TYPES.ERROR]: '❌',
            [NOTIFICATION_TYPES.WARNING]: '⚠️',
            [NOTIFICATION_TYPES.INFO]: 'ℹ️'
        };
        return icons[type] || icons[NOTIFICATION_TYPES.INFO];
    }
    
    getPriorityForType(type) {
        const priorities = {
            [NOTIFICATION_TYPES.ERROR]: 3,
            [NOTIFICATION_TYPES.WARNING]: 2,
            [NOTIFICATION_TYPES.SUCCESS]: 1,
            [NOTIFICATION_TYPES.INFO]: 0
        };
        return priorities[type] || 0;
    }
    
    displayToast(config) {
        const toastElement = this.createToastElement(config);
        this.toasts.set(config.id, {
            config,
            element: toastElement,
            timer: null,
            isPaused: false,
            remainingTime: config.duration,
            startTime: Date.now()
        });
        
        this.insertToast(toastElement);
        this.startTimer(config.id);
        this.playSound(config.type);
        this.trackToastEvent('shown', config);
        
        return config.id;
    }
    
    createToastElement(config) {
        const toast = Utils.createElement('div', {
            className: `toast toast-${config.type} ${config.customClass}`,
            'data-toast-id': config.id,
            role: 'alert',
            'aria-live': config.type === NOTIFICATION_TYPES.ERROR ? 'assertive' : 'polite',
            'aria-atomic': 'true',
            tabindex: '0'
        });
        
        const content = this.createToastContent(config);
        toast.appendChild(content);
        
        this.bindToastEvents(toast, config);
        
        if (this.config.enableAnimations) {
            toast.style.opacity = '0';
            toast.style.transform = this.getInitialTransform();
        }
        
        return toast;
    }
    
    createToastContent(config) {
        const content = Utils.createElement('div', {
            className: 'toast-content'
        });
        
        // Icon
        if (config.icon) {
            const icon = Utils.createElement('div', {
                className: 'toast-icon',
                innerHTML: config.icon,
                'aria-hidden': 'true'
            });
            content.appendChild(icon);
        }
        
        // Text content
        const textContainer = Utils.createElement('div', {
            className: 'toast-text'
        });
        
        if (config.title) {
            const title = Utils.createElement('div', {
                className: 'toast-title',
                textContent: config.title
            });
            textContainer.appendChild(title);
        }
        
        const message = Utils.createElement('div', {
            className: 'toast-message',
            textContent: config.message
        });
        textContainer.appendChild(message);
        
        if (config.description) {
            const description = Utils.createElement('div', {
                className: 'toast-description',
                textContent: config.description
            });
            textContainer.appendChild(description);
        }
        
        content.appendChild(textContainer);
        
        // Actions
        if (config.actions && config.actions.length > 0) {
            const actionsContainer = this.createActionsContainer(config);
            content.appendChild(actionsContainer);
        }
        
        // Close button
        const closeBtn = Utils.createElement('button', {
            className: 'toast-close',
            'aria-label': 'Закрити сповіщення',
            innerHTML: '&times;'
        });
        content.appendChild(closeBtn);
        
        // Progress bar
        if (this.config.enableProgress && !config.persistent) {
            const progressBar = this.createProgressBar(config);
            content.appendChild(progressBar);
        }
        
        return content;
    }
    
    createActionsContainer(config) {
        const container = Utils.createElement('div', {
            className: 'toast-actions'
        });
        
        config.actions.forEach(action => {
            const btn = Utils.createElement('button', {
                className: `toast-action ${action.style || 'primary'}`,
                textContent: action.text,
                'data-action': action.id
            });
            
            Utils.on(btn, 'click', (e) => {
                e.stopPropagation();
                this.handleActionClick(config.id, action);
            });
            
            container.appendChild(btn);
        });
        
        return container;
    }
    
    createProgressBar(config) {
        const progressContainer = Utils.createElement('div', {
            className: 'toast-progress-container'
        });
        
        const progressBar = Utils.createElement('div', {
            className: 'toast-progress-bar'
        });
        
        progressContainer.appendChild(progressBar);
        return progressContainer;
    }
    
    bindToastEvents(toastElement, config) {
        const toastData = this.toasts.get(config.id);
        
        // Close button
        const closeBtn = toastElement.querySelector('.toast-close');
        Utils.on(closeBtn, 'click', (e) => {
            e.stopPropagation();
            this.dismiss(config.id);
        });
        
        // Click to focus
        Utils.on(toastElement, 'click', () => {
            this.focusToast(config.id);
        });
        
        // Hover pause/resume
        if (this.config.pauseOnHover) {
            Utils.on(toastElement, 'mouseenter', () => {
                this.pauseToast(config.id);
            });
            
            Utils.on(toastElement, 'mouseleave', () => {
                this.resumeToast(config.id);
            });
        }
        
        // Keyboard events
        Utils.on(toastElement, 'keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    this.dismiss(config.id);
                    break;
                case 'Enter':
                case ' ':
                    if (!e.target.matches('button')) {
                        this.handleToastActivation(config.id);
                    }
                    break;
            }
        });
    }
    
    insertToast(toastElement) {
        if (this.config.stackDirection === 'up') {
            this.container.appendChild(toastElement);
        } else {
            this.container.insertBefore(toastElement, this.container.firstChild);
        }
        
        // Animate in
        if (this.config.enableAnimations) {
            requestAnimationFrame(() => {
                toastElement.style.transition = 'all 0.3s ease-out';
                toastElement.style.opacity = '1';
                toastElement.style.transform = 'translateX(0) translateY(0)';
            });
        }
    }
    
    getInitialTransform() {
        const position = this.config.position;
        
        if (position.includes('right')) {
            return 'translateX(100%)';
        } else if (position.includes('left')) {
            return 'translateX(-100%)';
        } else if (position.includes('top')) {
            return 'translateY(-100%)';
        } else {
            return 'translateY(100%)';
        }
    }
    
    // === TIMER MANAGEMENT ===
    
    startTimer(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || toastData.config.persistent) return;
        
        const startProgress = () => {
            const progressBar = toastData.element.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.transition = `width ${toastData.remainingTime}ms linear`;
                progressBar.style.width = '0%';
            }
        };
        
        const timer = setTimeout(() => {
            this.dismiss(toastId);
        }, toastData.remainingTime);
        
        toastData.timer = timer;
        toastData.startTime = Date.now();
        
        // Start progress bar animation
        requestAnimationFrame(startProgress);
    }
    
    pauseToast(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || toastData.isPaused || toastData.config.persistent) return;
        
        // Clear timer
        if (toastData.timer) {
            clearTimeout(toastData.timer);
            toastData.timer = null;
        }
        
        // Calculate remaining time
        const elapsed = Date.now() - toastData.startTime;
        toastData.remainingTime = Math.max(0, toastData.remainingTime - elapsed);
        toastData.isPaused = true;
        
        // Pause progress bar
        const progressBar = toastData.element.querySelector('.toast-progress-bar');
        if (progressBar) {
            const computedStyle = window.getComputedStyle(progressBar);
            progressBar.style.width = computedStyle.width;
            progressBar.style.transition = 'none';
        }
        
        toastData.element.classList.add('paused');
    }
    
    resumeToast(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData || !toastData.isPaused) return;
        
        toastData.isPaused = false;
        toastData.element.classList.remove('paused');
        
        if (toastData.remainingTime > 0) {
            this.startTimer(toastId);
        } else {
            this.dismiss(toastId);
        }
    }
    
    pauseAll() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.toasts.forEach((_, toastId) => {
            this.pauseToast(toastId);
        });
    }
    
    resumeAll() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.toasts.forEach((_, toastId) => {
            this.resumeToast(toastId);
        });
    }
    
    // === TOAST LIFECYCLE ===
    
    dismiss(toastId, reason = 'user') {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        // Clear timer
        if (toastData.timer) {
            clearTimeout(toastData.timer);
        }
        
        // Track dismissal
        this.trackToastEvent('dismissed', toastData.config, { reason });
        
        // Animate out
        this.animateOut(toastData.element, () => {
            // Remove from DOM
            if (toastData.element.parentNode) {
                toastData.element.parentNode.removeChild(toastData.element);
            }
            
            // Remove from collection
            this.toasts.delete(toastId);
            
            // Process queue
            this.processQueue();
        });
    }
    
    dismissAll(reason = 'user') {
        const toastIds = Array.from(this.toasts.keys());
        toastIds.forEach(id => this.dismiss(id, reason));
    }
    
    dismissByType(type) {
        this.toasts.forEach((toastData, toastId) => {
            if (toastData.config.type === type) {
                this.dismiss(toastId, 'type_filter');
            }
        });
    }
    
    animateOut(element, callback) {
        if (!this.config.enableAnimations) {
            callback();
            return;
        }
        
        element.style.transition = 'all 0.3s ease-in';
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform();
        
        setTimeout(callback, 300);
    }
    
    // === QUEUE MANAGEMENT ===
    
    addToQueue(config) {
        this.queue.push(config);
        this.queue.sort((a, b) => b.priority - a.priority);
        
        // Persist queue
        Utils.storage.set('toast_queue', this.queue.slice(0, 10)); // Keep max 10 in storage
    }
    
    processQueue() {
        if (this.isProcessingQueue || this.queue.length === 0) return;
        
        const availableSlots = this.config.maxVisible - this.getVisibleCount();
        if (availableSlots <= 0) return;
        
        this.isProcessingQueue = true;
        
        const toastsToShow = this.queue.splice(0, availableSlots);
        toastsToShow.forEach(config => {
            this.displayToast(config);
        });
        
        // Update stored queue
        Utils.storage.set('toast_queue', this.queue);
        
        this.isProcessingQueue = false;
    }
    
    clearQueue() {
        this.queue = [];
        Utils.storage.remove('toast_queue');
    }
    
    // === INTERACTION HANDLERS ===
    
    handleActionClick(toastId, action) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        // Execute action callback
        if (action.callback && typeof action.callback === 'function') {
            action.callback(toastData.config);
        }
        
        // Track action
        this.trackToastEvent('action_clicked', toastData.config, {
            action_id: action.id,
            action_text: action.text
        });
        
        // Auto-dismiss if action specifies
        if (action.dismissOnClick !== false) {
            this.dismiss(toastId, 'action');
        }
    }
    
    handleToastActivation(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        // If toast has a default action, execute it
        if (toastData.config.defaultAction) {
            this.handleActionClick(toastId, toastData.config.defaultAction);
        } else {
            // Otherwise just dismiss
            this.dismiss(toastId, 'activation');
        }
    }
    
    focusToast(toastId) {
        const toastData = this.toasts.get(toastId);
        if (!toastData) return;
        
        // Remove focus from other toasts
        this.toasts.forEach((data, id) => {
            if (id !== toastId) {
                data.element.classList.remove('focused');
            }
        });
        
        // Focus this toast
        toastData.element.classList.add('focused');
        toastData.element.focus();
        this.focusedToast = toastId;
    }
    
    navigateToasts(direction) {
        const toastIds = Array.from(this.toasts.keys());
        if (toastIds.length === 0) return;
        
        let currentIndex = this.focusedToast ? 
            toastIds.indexOf(this.focusedToast) : -1;
        
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) {
            newIndex = toastIds.length - 1;
        } else if (newIndex >= toastIds.length) {
            newIndex = 0;
        }
        
        this.focusToast(toastIds[newIndex]);
    }
    
    // === UTILITY METHODS ===
    
    getVisibleCount() {
        return this.toasts.size;
    }
    
    getQueueLength() {
        return this.queue.length;
    }
    
    hasToast(toastId) {
        return this.toasts.has(toastId);
    }
    
    getToastById(toastId) {
        return this.toasts.get(toastId);
    }
    
    getAllToasts() {
        return Array.from(this.toasts.values());
    }
    
    getToastsByType(type) {
        return Array.from(this.toasts.values())
            .filter(toastData => toastData.config.type === type);
    }
    
    playSound(type) {
        if (!this.config.enableSound || !this.soundPlayer) return;
        
        const sound = this.soundPlayer[type];
        if (sound) {
            sound.currentTime = 0;
            sound.volume = 0.3;
            sound.play().catch(() => {
                // Ignore sound play errors
            });
        }
    }
    
    // === CONFIGURATION ===
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update container position if changed
        if (newConfig.position) {
            this.container.className = `toast-container toast-${this.config.position}`;
        }
        
        // Update animations if changed
        if (newConfig.enableAnimations !== undefined) {
            if (!newConfig.enableAnimations) {
                this.toasts.forEach(toastData => {
                    toastData.element.style.transition = 'none';
                });
            }
        }
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    // === PRESET METHODS ===
    
    success(message, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.SUCCESS, options);
    }
    
    error(message, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.ERROR, {
            persistent: false,
            ...options
        });
    }
    
    warning(message, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.WARNING, options);
    }
    
    info(message, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.INFO, options);
    }
    
    // Complex toast types
    loading(message, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.INFO, {
            icon: '⏳',
            persistent: true,
            customClass: 'toast-loading',
            ...options
        });
    }
    
    confirmation(message, onConfirm, onCancel = null, options = {}) {
        return this.show(message, NOTIFICATION_TYPES.WARNING, {
            persistent: true,
            actions: [
                {
                    id: 'confirm',
                    text: 'Підтвердити',
                    style: 'primary',
                    callback: onConfirm
                },
                {
                    id: 'cancel',
                    text: 'Скасувати',
                    style: 'secondary',
                    callback: onCancel || (() => {})
                }
            ],
            ...options
        });
    }
    
    // === ANALYTICS ===
    
    trackToastEvent(event, config, additionalData = {}) {
        if (window.analytics) {
            window.analytics.track(`toast_${event}`, {
                toast_id: config.id,
                toast_type: config.type,
                toast_message: config.message,
                toast_duration: config.duration,
                toast_persistent: config.persistent,
                timestamp: Date.now(),
                ...additionalData
            });
        }
    }
    
    // === ACCESSIBILITY ===
    
    announceToScreen(message, priority = 'polite') {
        // Create temporary announcement element
        const announcement = Utils.createElement('div', {
            className: 'sr-only',
            'aria-live': priority,
            'aria-atomic': 'true',
            textContent: message
        });
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 1000);
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Dismiss all toasts
        this.dismissAll('destroy');
        
        // Clear queue
        this.clearQueue();
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Clear references
        this.toasts.clear();
        this.queue = [];
        this.container = null;
        this.soundPlayer = null;
        this.focusedToast = null;
        
        console.log('🍞 Toast Manager destroyed');
    }
    
    // === DEBUG METHODS ===
    
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group('🍞 Toast Manager Debug');
        console.log('Visible toasts:', this.getVisibleCount());
        console.log('Queue length:', this.getQueueLength());
        console.log('Configuration:', this.config);
        console.log('Active toasts:', Array.from(this.toasts.entries()));
        console.log('Queue:', this.queue);
        console.groupEnd();
    }
    
    getStats() {
        return {
            visibleCount: this.getVisibleCount(),
            queueLength: this.getQueueLength(),
            totalShown: this.nextId - 1,
            byType: {
                success: this.getToastsByType(NOTIFICATION_TYPES.SUCCESS).length,
                error: this.getToastsByType(NOTIFICATION_TYPES.ERROR).length,
                warning: this.getToastsByType(NOTIFICATION_TYPES.WARNING).length,
                info: this.getToastsByType(NOTIFICATION_TYPES.INFO).length
            }
        };
    }
}

// Toast utility functions
export class ToastUtils {
    /**
     * Показати прогрес завантаження
     */
    static showProgress(message, progress = 0) {
        const progressBar = `
            <div class="toast-progress-custom">
                <div class="progress-bar" style="width: ${progress}%"></div>
                <span class="progress-text">${progress}%</span>
            </div>
        `;
        
        return window.toastManager?.show(message, NOTIFICATION_TYPES.INFO, {
            persistent: true,
            customClass: 'toast-progress',
            description: progressBar
        });
    }
    
    /**
     * Оновити прогрес існуючого toast
     */
    static updateProgress(toastId, progress, message = null) {
        const toastData = window.toastManager?.getToastById(toastId);
        if (!toastData) return;
        
        const progressBar = toastData.element.querySelector('.progress-bar');
        const progressText = toastData.element.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
        
        if (message) {
            const messageEl = toastData.element.querySelector('.toast-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        // Auto-dismiss when complete
        if (progress >= 100) {
            setTimeout(() => {
                window.toastManager?.dismiss(toastId, 'completed');
            }, 1000);
        }
    }
    
    /**
     * Показати повідомлення про замовлення
     */
    static showOrderUpdate(status, orderNumber, details = {}) {
        const statusMessages = {
            pending: 'Замовлення прийнято',
            confirmed: 'Замовлення підтверджено',
            preparing: 'Готується',
            ready: 'Готово до видачі',
            delivering: 'В дорозі',
            delivered: 'Доставлено'
        };
        
        const statusIcons = {
            pending: '📝',
            confirmed: '✅',
            preparing: '👨‍🍳',
            ready: '🔔',
            delivering: '🚗',
            delivered: '🎉'
        };
        
        const message = statusMessages[status] || 'Оновлення замовлення';
        const icon = statusIcons[status] || '📦';
        
        return window.toastManager?.show(message, NOTIFICATION_TYPES.INFO, {
            title: `Замовлення #${orderNumber}`,
            icon: icon,
            duration: 8000,
            actions: details.trackingUrl ? [{
                id: 'track',
                text: 'Відстежити',
                callback: () => window.open(details.trackingUrl, '_blank')
            }] : []
        });
    }
    
    /**
     * Показати системне повідомлення
     */
    static showSystemMessage(type, message, details = {}) {
        const systemMessages = {
            maintenance: {
                icon: '🔧',
                type: NOTIFICATION_TYPES.WARNING,
                persistent: true
            },
            update: {
                icon: '🔄',
                type: NOTIFICATION_TYPES.INFO,
                persistent: false
            },
            connectivity: {
                icon: '📶',
                type: NOTIFICATION_TYPES.WARNING,
                persistent: true
            }
        };
        
        const config = systemMessages[type] || systemMessages.update;
        
        return window.toastManager?.show(message, config.type, {
            icon: config.icon,
            persistent: config.persistent,
            customClass: `toast-system toast-${type}`,
            ...details
        });
    }
    
    /**
     * Групове відображення повідомлень
     */
    static showBatch(messages, delay = 500) {
        messages.forEach((messageConfig, index) => {
            setTimeout(() => {
                window.toastManager?.show(
                    messageConfig.message,
                    messageConfig.type || NOTIFICATION_TYPES.INFO,
                    messageConfig.options || {}
                );
            }, index * delay);
        });
    }
    
    /**
     * Показати повідомлення з таймером
     */
    static showCountdown(message, seconds, onComplete = null) {
        let remaining = seconds;
        
        const toastId = window.toastManager?.show(
            `${message} (${remaining}s)`,
            NOTIFICATION_TYPES.INFO,
            {
                persistent: true,
                customClass: 'toast-countdown'
            }
        );
        
        const interval = setInterval(() => {
            remaining--;
            
            const toastData = window.toastManager?.getToastById(toastId);
            if (toastData) {
                const messageEl = toastData.element.querySelector('.toast-message');
                if (messageEl) {
                    messageEl.textContent = `${message} (${remaining}s)`;
                }
            }
            
            if (remaining <= 0) {
                clearInterval(interval);
                window.toastManager?.dismiss(toastId, 'countdown_complete');
                
                if (onComplete) {
                    onComplete();
                }
            }
        }, 1000);
        
        return toastId;
    }
}

// Preset toast configurations
export const TOAST_PRESETS = {
    // Order related
    ORDER_PLACED: {
        type: NOTIFICATION_TYPES.SUCCESS,
        icon: '🛒',
        duration: 6000
    },
    ORDER_CONFIRMED: {
        type: NOTIFICATION_TYPES.SUCCESS,
        icon: '✅',
        duration: 5000
    },
    ORDER_CANCELLED: {
        type: NOTIFICATION_TYPES.WARNING,
        icon: '❌',
        duration: 5000
    },
    
    // Cart related
    ITEM_ADDED: {
        type: NOTIFICATION_TYPES.SUCCESS,
        icon: '➕',
        duration: 3000
    },
    ITEM_REMOVED: {
        type: NOTIFICATION_TYPES.INFO,
        icon: '➖',
        duration: 3000
    },
    CART_CLEARED: {
        type: NOTIFICATION_TYPES.INFO,
        icon: '🗑️',
        duration: 4000
    },
    
    // Form related
    FORM_SUBMITTED: {
        type: NOTIFICATION_TYPES.SUCCESS,
        icon: '📧',
        duration: 5000
    },
    FORM_ERROR: {
        type: NOTIFICATION_TYPES.ERROR,
        icon: '⚠️',
        duration: 6000
    },
    
    // System related
    NETWORK_ERROR: {
        type: NOTIFICATION_TYPES.ERROR,
        icon: '🌐',
        duration: 8000,
        persistent: true
    },
    OFFLINE: {
        type: NOTIFICATION_TYPES.WARNING,
        icon: '📶',
        duration: 0,
        persistent: true
    },
    ONLINE: {
        type: NOTIFICATION_TYPES.SUCCESS,
        icon: '✅',
        duration: 3000
    }
};

// Global toast manager instance
let toastManagerInstance = null;

/**
 * Get or create global toast manager instance
 */
export function getToastManager() {
    if (!toastManagerInstance) {
        toastManagerInstance = new ToastManager();
        
        // Make it globally available
        if (typeof window !== 'undefined') {
            window.toastManager = toastManagerInstance;
        }
    }
    
    return toastManagerInstance;
}

/**
 * Initialize toast manager with custom config
 */
export function initToastManager(config = {}) {
    const manager = getToastManager();
    manager.updateConfig(config);
    return manager;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    getToastManager();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        getToastManager();
    });
}

export default ToastManager;