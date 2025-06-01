// ===== ANIMATION-MANAGER.JS - УПРАВЛІННЯ АНІМАЦІЯМИ =====

// Core utilities and configuration
import { Utils } from './utils.js';
import { CONFIG, ANALYTICS_EVENTS } from './config.js';

export class AnimationManager {
    constructor() {
        // State
        this.animations = new Map();
        this.observers = new Map();
        this.animationId = 0;
        this.isReducedMotion = false;
        
        // Configuration
        this.config = {
            defaultDuration: 300,
            defaultEasing: 'ease-out',
            threshold: 0.1,
            rootMargin: '50px',
            enableScrollAnimations: true,
            enableHoverAnimations: true,
            enableClickAnimations: true,
            staggerDelay: 100
        };
        
        // Animation presets
        this.presets = this.initializePresets();
        
        this.init();
    }
    
    init() {
        this.checkReducedMotion();
        this.setupIntersectionObserver();
        this.bindGlobalEvents();
        this.initializeScrollAnimations();
        this.setupCounterAnimations();
        
        console.log('🎬 Animation Manager initialized');
    }
    
    checkReducedMotion() {
        this.isReducedMotion = window.matchMedia && 
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (this.isReducedMotion) {
            document.documentElement.classList.add('reduced-motion');
            this.config.defaultDuration = 1;
        }
    }
    
    initializePresets() {
        return {
            fadeIn: {
                keyframes: [
                    { opacity: 0 },
                    { opacity: 1 }
                ],
                options: { duration: 600, easing: 'ease-out' }
            },
            fadeOut: {
                keyframes: [
                    { opacity: 1 },
                    { opacity: 0 }
                ],
                options: { duration: 400, easing: 'ease-in' }
            },
            slideInUp: {
                keyframes: [
                    { transform: 'translateY(30px)', opacity: 0 },
                    { transform: 'translateY(0)', opacity: 1 }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            },
            slideInDown: {
                keyframes: [
                    { transform: 'translateY(-30px)', opacity: 0 },
                    { transform: 'translateY(0)', opacity: 1 }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            },
            slideInLeft: {
                keyframes: [
                    { transform: 'translateX(-30px)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            },
            slideInRight: {
                keyframes: [
                    { transform: 'translateX(30px)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 }
                ],
                options: { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            },
            scaleIn: {
                keyframes: [
                    { transform: 'scale(0.8)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                options: { duration: 500, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
            },
            scaleOut: {
                keyframes: [
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0.8)', opacity: 0 }
                ],
                options: { duration: 300, easing: 'ease-in' }
            },
            bounce: {
                keyframes: [
                    { transform: 'translateY(0)' },
                    { transform: 'translateY(-10px)', offset: 0.5 },
                    { transform: 'translateY(0)' }
                ],
                options: { duration: 600, easing: 'ease-out' }
            },
            pulse: {
                keyframes: [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)', offset: 0.5 },
                    { transform: 'scale(1)' }
                ],
                options: { duration: 1000, easing: 'ease-in-out', iterations: Infinity }
            },
            shake: {
                keyframes: [
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-5px)', offset: 0.25 },
                    { transform: 'translateX(5px)', offset: 0.75 },
                    { transform: 'translateX(0)' }
                ],
                options: { duration: 400, easing: 'ease-in-out' }
            },
            wobble: {
                keyframes: [
                    { transform: 'rotate(0deg)' },
                    { transform: 'rotate(-3deg)', offset: 0.25 },
                    { transform: 'rotate(3deg)', offset: 0.75 },
                    { transform: 'rotate(0deg)' }
                ],
                options: { duration: 600, easing: 'ease-in-out' }
            },
            float: {
                keyframes: [
                    { transform: 'translateY(0px)' },
                    { transform: 'translateY(-10px)', offset: 0.5 },
                    { transform: 'translateY(0px)' }
                ],
                options: { duration: 3000, easing: 'ease-in-out', iterations: Infinity }
            },
            rotate: {
                keyframes: [
                    { transform: 'rotate(0deg)' },
                    { transform: 'rotate(360deg)' }
                ],
                options: { duration: 1000, easing: 'linear', iterations: Infinity }
            }
        };
    }
    
    setupIntersectionObserver() {
        if (!window.IntersectionObserver || this.isReducedMotion) return;
        
        const observerOptions = {
            threshold: this.config.threshold,
            rootMargin: this.config.rootMargin
        };
        
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerScrollAnimation(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all elements with animation attributes
        this.observeScrollElements();
    }
    
    observeScrollElements() {
        const elements = document.querySelectorAll('[data-animate], .animate-on-scroll');
        elements.forEach(element => {
            if (this.scrollObserver) {
                this.scrollObserver.observe(element);
            }
        });
    }
    
    bindGlobalEvents() {
        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.refreshObservers();
        }, 250));
        
        // Reduced motion changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            mediaQuery.addEventListener('change', () => {
                this.checkReducedMotion();
                this.updateAnimationsForMotionPreference();
            });
        }
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllAnimations();
            } else {
                this.resumeAllAnimations();
            }
        });
    }
    
    initializeScrollAnimations() {
        if (!this.config.enableScrollAnimations || this.isReducedMotion) return;
        
        // Auto-detect and setup scroll animations
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach((element, index) => {
            this.setupScrollAnimation(element, {
                delay: index * this.config.staggerDelay
            });
        });
    }
    
    setupCounterAnimations() {
        const counters = document.querySelectorAll('[data-counter]');
        counters.forEach(counter => {
            if (this.scrollObserver) {
                this.scrollObserver.observe(counter);
            }
        });
    }
    
    // === CORE ANIMATION METHODS ===
    
    animate(element, preset, options = {}) {
        if (this.isReducedMotion) return Promise.resolve();
        
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return Promise.resolve();
        
        const animationConfig = this.getAnimationConfig(preset, options);
        const animationId = this.generateAnimationId();
        
        const animation = element.animate(
            animationConfig.keyframes,
            animationConfig.options
        );
        
        this.animations.set(animationId, {
            animation,
            element,
            preset,
            options: animationConfig.options
        });
        
        return new Promise((resolve) => {
            animation.addEventListener('finish', () => {
                this.animations.delete(animationId);
                resolve();
            });
            
            animation.addEventListener('cancel', () => {
                this.animations.delete(animationId);
                resolve();
            });
        });
    }
    
    getAnimationConfig(preset, options) {
        const baseConfig = this.presets[preset];
        if (!baseConfig) {
            throw new Error(`Animation preset "${preset}" not found`);
        }
        
        return {
            keyframes: baseConfig.keyframes,
            options: {
                ...baseConfig.options,
                ...options,
                duration: this.isReducedMotion ? 1 : (options.duration || baseConfig.options.duration)
            }
        };
    }
    
    generateAnimationId() {
        return `anim_${++this.animationId}_${Date.now()}`;
    }
    
    // === SCROLL ANIMATIONS ===
    
    setupScrollAnimation(element, options = {}) {
        const animationType = element.dataset.animate || 'slideInUp';
        const delay = parseInt(element.dataset.delay) || options.delay || 0;
        const duration = parseInt(element.dataset.duration) || options.duration;
        
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        
        element._animationConfig = {
            type: animationType,
            delay,
            duration,
            triggered: false
        };
    }
    
    triggerScrollAnimation(element) {
        if (element._animationConfig?.triggered) return;
        
        const config = element._animationConfig;
        
        // Handle counter animation
        if (element.dataset.counter) {
            this.animateCounter(element);
            return;
        }
        
        // Handle regular scroll animation
        if (config) {
            setTimeout(() => {
                element.style.visibility = 'visible';
                this.animate(element, config.type, {
                    duration: config.duration
                });
                config.triggered = true;
            }, config.delay);
        } else {
            // Default animation
            element.style.visibility = 'visible';
            this.animate(element, 'slideInUp');
        }
        
        // Unobserve after animation
        if (this.scrollObserver) {
            this.scrollObserver.unobserve(element);
        }
    }
    
    // === COUNTER ANIMATION ===
    
    animateCounter(element) {
        const targetValue = parseInt(element.dataset.counter) || parseInt(element.textContent);
        const duration = parseInt(element.dataset.duration) || 2000;
        const startValue = parseInt(element.dataset.start) || 0;
        const suffix = element.dataset.suffix || '';
        const prefix = element.dataset.prefix || '';
        
        if (isNaN(targetValue)) return;
        
        element.style.visibility = 'visible';
        
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.round(startValue + (targetValue - startValue) * easedProgress);
            element.textContent = prefix + currentValue.toLocaleString() + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    // === STAGGER ANIMATIONS ===
    
    staggerIn(elements, preset = 'slideInUp', options = {}) {
        if (this.isReducedMotion) return Promise.resolve();
        
        const delay = options.staggerDelay || this.config.staggerDelay;
        const promises = [];
        
        elements.forEach((element, index) => {
            const animationPromise = new Promise((resolve) => {
                setTimeout(() => {
                    this.animate(element, preset, options).then(resolve);
                }, index * delay);
            });
            promises.push(animationPromise);
        });
        
        return Promise.all(promises);
    }
    
    staggerOut(elements, preset = 'fadeOut', options = {}) {
        if (this.isReducedMotion) return Promise.resolve();
        
        const delay = options.staggerDelay || this.config.staggerDelay;
        const promises = [];
        
        // Reverse order for out animations
        const reversedElements = Array.from(elements).reverse();
        
        reversedElements.forEach((element, index) => {
            const animationPromise = new Promise((resolve) => {
                setTimeout(() => {
                    this.animate(element, preset, options).then(resolve);
                }, index * delay);
            });
            promises.push(animationPromise);
        });
        
        return Promise.all(promises);
    }
    
    // === HOVER ANIMATIONS ===
    
    setupHoverAnimation(element, inPreset = 'scaleIn', outPreset = 'scaleOut', options = {}) {
        if (!this.config.enableHoverAnimations || this.isReducedMotion) return;
        
        let isAnimating = false;
        
        const handleMouseEnter = () => {
            if (isAnimating) return;
            isAnimating = true;
            
            this.animate(element, inPreset, {
                duration: 200,
                ...options.in
            }).then(() => {
                isAnimating = false;
            });
        };
        
        const handleMouseLeave = () => {
            if (isAnimating) return;
            isAnimating = true;
            
            this.animate(element, outPreset, {
                duration: 150,
                ...options.out
            }).then(() => {
                isAnimating = false;
            });
        };
        
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // Store cleanup function
        element._hoverCleanup = () => {
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }
    
    // === CLICK ANIMATIONS ===
    
    setupClickAnimation(element, preset = 'pulse', options = {}) {
        if (!this.config.enableClickAnimations || this.isReducedMotion) return;
        
        const handleClick = (e) => {
            // Create ripple effect
            if (options.ripple) {
                this.createRippleEffect(element, e);
            }
            
            // Run animation
            this.animate(element, preset, {
                duration: 150,
                ...options
            });
        };
        
        element.addEventListener('click', handleClick);
        
        // Store cleanup function
        element._clickCleanup = () => {
            element.removeEventListener('click', handleClick);
        };
    }
    
    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            transform: scale(0);
            z-index: 1000;
        `;
        
        // Ensure parent has relative position
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        // Animate ripple
        ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).addEventListener('finish', () => {
            ripple.remove();
        });
    }
    
    // === LOADING ANIMATIONS ===
    
    showLoader(element, type = 'spinner') {
        const loaders = {
            spinner: this.createSpinnerLoader(),
            dots: this.createDotsLoader(),
            bars: this.createBarsLoader(),
            pulse: this.createPulseLoader()
        };
        
        const loader = loaders[type] || loaders.spinner;
        loader.className += ' animation-loader';
        
        // Store original content
        element._originalContent = element.innerHTML;
        element._originalState = {
            disabled: element.disabled,
            pointerEvents: element.style.pointerEvents
        };
        
        // Show loader
        element.innerHTML = '';
        element.appendChild(loader);
        element.disabled = true;
        element.style.pointerEvents = 'none';
        
        return loader;
    }
    
    hideLoader(element) {
        const loader = element.querySelector('.animation-loader');
        if (loader) {
            loader.remove();
        }
        
        // Restore original content
        if (element._originalContent !== undefined) {
            element.innerHTML = element._originalContent;
            delete element._originalContent;
        }
        
        // Restore original state
        if (element._originalState) {
            element.disabled = element._originalState.disabled;
            element.style.pointerEvents = element._originalState.pointerEvents;
            delete element._originalState;
        }
    }
    
    createSpinnerLoader() {
        const spinner = document.createElement('div');
        spinner.innerHTML = `
            <div style="
                width: 20px;
                height: 20px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #333;
                border-radius: 50%;
                animation: ${this.createSpinAnimation()} 1s linear infinite;
            "></div>
        `;
        return spinner;
    }
    
    createDotsLoader() {
        const dots = document.createElement('div');
        dots.innerHTML = `
            <div style="display: flex; gap: 4px;">
                <div style="width: 8px; height: 8px; background: #333; border-radius: 50%; animation: ${this.createBounceAnimation()} 1.4s ease-in-out infinite both;"></div>
                <div style="width: 8px; height: 8px; background: #333; border-radius: 50%; animation: ${this.createBounceAnimation()} 1.4s ease-in-out 0.16s infinite both;"></div>
                <div style="width: 8px; height: 8px; background: #333; border-radius: 50%; animation: ${this.createBounceAnimation()} 1.4s ease-in-out 0.32s infinite both;"></div>
            </div>
        `;
        return dots;
    }
    
    createBarsLoader() {
        const bars = document.createElement('div');
        bars.innerHTML = `
            <div style="display: flex; gap: 2px;">
                <div style="width: 3px; height: 16px; background: #333; animation: ${this.createBarAnimation()} 1.2s ease-in-out infinite;"></div>
                <div style="width: 3px; height: 16px; background: #333; animation: ${this.createBarAnimation()} 1.2s ease-in-out 0.1s infinite;"></div>
                <div style="width: 3px; height: 16px; background: #333; animation: ${this.createBarAnimation()} 1.2s ease-in-out 0.2s infinite;"></div>
                <div style="width: 3px; height: 16px; background: #333; animation: ${this.createBarAnimation()} 1.2s ease-in-out 0.3s infinite;"></div>
            </div>
        `;
        return bars;
    }
    
    createPulseLoader() {
        const pulse = document.createElement('div');
        pulse.innerHTML = `
            <div style="
                width: 16px;
                height: 16px;
                background: #333;
                border-radius: 50%;
                animation: ${this.createPulseAnimation()} 1s ease-in-out infinite;
            "></div>
        `;
        return pulse;
    }
    
    createSpinAnimation() {
        const animationName = `spin-${Date.now()}`;
        this.injectCSS(`
            @keyframes ${animationName} {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `);
        return animationName;
    }
    
    createBounceAnimation() {
        const animationName = `bounce-${Date.now()}`;
        this.injectCSS(`
            @keyframes ${animationName} {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
        `);
        return animationName;
    }
    
    createBarAnimation() {
        const animationName = `bar-${Date.now()}`;
        this.injectCSS(`
            @keyframes ${animationName} {
                0%, 40%, 100% { transform: scaleY(0.4); }
                20% { transform: scaleY(1); }
            }
        `);
        return animationName;
    }
    
    createPulseAnimation() {
        const animationName = `pulse-${Date.now()}`;
        this.injectCSS(`
            @keyframes ${animationName} {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
            }
        `);
        return animationName;
    }
    
    injectCSS(css) {
        let styleSheet = document.getElementById('animation-manager-styles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'animation-manager-styles';
            document.head.appendChild(styleSheet);
        }
        styleSheet.innerHTML += css;
    }
    
    // === TRANSITION HELPERS ===
    
    slideToggle(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
            return Promise.resolve();
        }
        
        const isHidden = element.style.display === 'none' || 
                        getComputedStyle(element).display === 'none';
        
        if (isHidden) {
            return this.slideDown(element, duration);
        } else {
            return this.slideUp(element, duration);
        }
    }
    
    slideDown(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = '';
            return Promise.resolve();
        }
        
        element.style.display = '';
        const height = element.scrollHeight;
        
        element.style.height = '0';
        element.style.overflow = 'hidden';
        
        return element.animate([
            { height: '0px' },
            { height: `${height}px` }
        ], {
            duration,
            easing: 'ease-out'
        }).finished.then(() => {
            element.style.height = '';
            element.style.overflow = '';
        });
    }
    
    slideUp(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = 'none';
            return Promise.resolve();
        }
        
        const height = element.scrollHeight;
        element.style.height = `${height}px`;
        element.style.overflow = 'hidden';
        
        return element.animate([
            { height: `${height}px` },
            { height: '0px' }
        ], {
            duration,
            easing: 'ease-in'
        }).finished.then(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
        });
    }
    
    fadeToggle(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
            return Promise.resolve();
        }
        
        const isHidden = element.style.display === 'none' || 
                        getComputedStyle(element).opacity === '0';
        
        if (isHidden) {
            return this.fadeIn(element, duration);
        } else {
            return this.fadeOut(element, duration);
        }
    }
    
    fadeIn(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = '';
            element.style.opacity = '1';
            return Promise.resolve();
        }
        
        element.style.display = '';
        element.style.opacity = '0';
        
        return element.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration,
            easing: 'ease-out'
        }).finished.then(() => {
            element.style.opacity = '1';
        });
    }
    
    fadeOut(element, duration = 300) {
        if (this.isReducedMotion) {
            element.style.display = 'none';
            return Promise.resolve();
        }
        
        return element.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration,
            easing: 'ease-in'
        }).finished.then(() => {
            element.style.display = 'none';
            element.style.opacity = '0';
        });
    }
    
    // === ANIMATION CONTROL ===
    
    pauseAllAnimations() {
        this.animations.forEach(({ animation }) => {
            animation.pause();
        });
    }
    
    resumeAllAnimations() {
        this.animations.forEach(({ animation }) => {
            animation.play();
        });
    }
    
    cancelAllAnimations() {
        this.animations.forEach(({ animation }) => {
            animation.cancel();
        });
        this.animations.clear();
    }
    
    updateAnimationsForMotionPreference() {
        if (this.isReducedMotion) {
            this.cancelAllAnimations();
            
            // Remove all scroll animations
            document.querySelectorAll('[data-animate]').forEach(element => {
                element.style.opacity = '1';
                element.style.visibility = 'visible';
                element.style.transform = 'none';
            });
        }
    }
    
    // === UTILITY METHODS ===
    
    refreshObservers() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.observeScrollElements();
        }
    }
    
    addScrollElement(element) {
        if (this.scrollObserver && !element._animationConfig?.triggered) {
            this.setupScrollAnimation(element);
            this.scrollObserver.observe(element);
        }
    }
    
    removeScrollElement(element) {
        if (this.scrollObserver) {
            this.scrollObserver.unobserve(element);
        }
    }
    
    // === PRESET MANAGEMENT ===
    
    addPreset(name, config) {
        this.presets[name] = config;
    }
    
    removePreset(name) {
        delete this.presets[name];
    }
    
    getPreset(name) {
        return this.presets[name];
    }
    
    listPresets() {
        return Object.keys(this.presets);
    }
    
    // === CONFIGURATION ===
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (newConfig.enableScrollAnimations !== undefined) {
            if (newConfig.enableScrollAnimations) {
                this.setupIntersectionObserver();
                this.observeScrollElements();
            } else if (this.scrollObserver) {
                this.scrollObserver.disconnect();
            }
        }
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Cancel all animations
        this.cancelAllAnimations();
        
        // Disconnect observers
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
        
        // Clean up event listeners
        document.querySelectorAll('[data-animate]').forEach(element => {
            if (element._hoverCleanup) {
                element._hoverCleanup();
                delete element._hoverCleanup;
            }
            if (element._clickCleanup) {
                element._clickCleanup();
                delete element._clickCleanup;
            }
        });
        
        // Remove injected styles
        const styleSheet = document.getElementById('animation-manager-styles');
        if (styleSheet) {
            styleSheet.remove();
        }
        
        // Clear references
        this.animations.clear();
        this.observers.clear();
        
        console.log('🎬 Animation Manager destroyed');
    }
    
    // === DEBUG METHODS ===
    
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group('🎬 Animation Manager Debug');
        console.log('Active animations:', this.animations.size);
        console.log('Reduced motion:', this.isReducedMotion);
        console.log('Available presets:', Object.keys(this.presets));
        console.log('Configuration:', this.config);
        console.log('Scroll observer active:', !!this.scrollObserver);
        console.groupEnd();
    }
    
    getStats() {
        return {
            activeAnimations: this.animations.size,
            availablePresets: Object.keys(this.presets).length,
            isReducedMotion: this.isReducedMotion,
            scrollObserverActive: !!this.scrollObserver,
            config: this.config
        };
    }
}

// Animation utility functions
export class AnimationUtils {
    /**
     * Animate element with custom keyframes
     */
    static animateCustom(element, keyframes, options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return Promise.resolve();
        
        const defaultOptions = {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        };
        
        return element.animate(keyframes, { ...defaultOptions, ...options }).finished;
    }
    
    /**
     * Створити морфінг анімацію між двома станами
     */
    static morphBetween(element, fromState, toState, duration = 500) {
        const keyframes = [fromState, toState];
        
        return this.animateCustom(element, keyframes, {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
    }
    
    /**
     * Анімувати зміну кольору
     */
    static animateColor(element, fromColor, toColor, duration = 300) {
        return this.animateCustom(element, [
            { backgroundColor: fromColor },
            { backgroundColor: toColor }
        ], { duration });
    }
    
    /**
     * Анімувати текст по символах
     */
    static animateTextReveal(element, options = {}) {
        const text = element.textContent;
        const chars = text.split('');
        
        element.innerHTML = '';
        
        const promises = chars.map((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            element.appendChild(span);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    span.animate([
                        { opacity: 0, transform: 'translateY(20px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], {
                        duration: options.duration || 400,
                        easing: 'ease-out',
                        fill: 'forwards'
                    }).addEventListener('finish', resolve);
                }, index * (options.stagger || 50));
            });
        });
        
        return Promise.all(promises);
    }
    
    /**
     * Анімувати друкування тексту
     */
    static typeWriter(element, text, options = {}) {
        const speed = options.speed || 50;
        const cursor = options.cursor || '|';
        const showCursor = options.showCursor !== false;
        
        element.textContent = '';
        
        if (showCursor) {
            element.innerHTML = cursor;
        }
        
        return new Promise(resolve => {
            let i = 0;
            
            const type = () => {
                if (i < text.length) {
                    const currentText = text.substring(0, i + 1);
                    element.innerHTML = showCursor ? currentText + cursor : currentText;
                    i++;
                    setTimeout(type, speed);
                } else {
                    if (showCursor && options.removeCursor) {
                        setTimeout(() => {
                            element.textContent = text;
                            resolve();
                        }, 500);
                    } else {
                        resolve();
                    }
                }
            };
            
            type();
        });
    }
    
    /**
     * Створити particle ефект
     */
    static createParticleEffect(container, options = {}) {
        const particleCount = options.count || 50;
        const colors = options.colors || ['#ff6b35', '#d2001f', '#daa520'];
        const duration = options.duration || 2000;
        
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            container.appendChild(particle);
            particles.push(particle);
            
            // Random start position
            const startX = Math.random() * container.offsetWidth;
            const startY = Math.random() * container.offsetHeight;
            
            // Random end position
            const endX = startX + (Math.random() - 0.5) * 200;
            const endY = startY + (Math.random() - 0.5) * 200;
            
            particle.animate([
                {
                    left: `${startX}px`,
                    top: `${startY}px`,
                    opacity: 1,
                    transform: 'scale(1)'
                },
                {
                    left: `${endX}px`,
                    top: `${endY}px`,
                    opacity: 0,
                    transform: 'scale(0)'
                }
            ], {
                duration: duration + Math.random() * 1000,
                easing: 'ease-out'
            }).addEventListener('finish', () => {
                particle.remove();
            });
        }
        
        return particles;
    }
    
    /**
     * Створити confetti ефект
     */
    static createConfetti(options = {}) {
        const container = options.container || document.body;
        const particleCount = options.count || 100;
        const colors = options.colors || ['#ff6b35', '#d2001f', '#daa520', '#4caf50', '#2196f3'];
        
        for (let i = 0; i < particleCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                z-index: 10000;
                pointer-events: none;
            `;
            
            // Random start position at top
            const startX = Math.random() * window.innerWidth;
            confetti.style.left = `${startX}px`;
            confetti.style.top = '-10px';
            
            container.appendChild(confetti);
            
            const fallDistance = window.innerHeight + 100;
            const duration = 3000 + Math.random() * 2000;
            const drift = (Math.random() - 0.5) * 100;
            
            confetti.animate([
                {
                    transform: 'translateY(0) translateX(0) rotate(0deg)',
                    opacity: 1
                },
                {
                    transform: `translateY(${fallDistance}px) translateX(${drift}px) rotate(720deg)`,
                    opacity: 0
                }
            ], {
                duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).addEventListener('finish', () => {
                confetti.remove();
            });
        }
    }
    
    /**
     * Parallax ефект для елементу
     */
    static setupParallax(element, options = {}) {
        const speed = options.speed || 0.5;
        const direction = options.direction || 'vertical';
        
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;
            
            if (direction === 'vertical') {
                element.style.transform = `translateY(${rate}px)`;
            } else {
                element.style.transform = `translateX(${rate}px)`;
            }
            
            ticking = false;
        };
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Return cleanup function
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }
}

// Готові анімаційні сценарії
export const ANIMATION_SCENARIOS = {
    // Сценарій для появи меню
    menuReveal: {
        container: (element) => {
            return window.animationManager.animate(element, 'fadeIn', { duration: 200 });
        },
        items: (elements) => {
            return window.animationManager.staggerIn(elements, 'slideInUp', {
                staggerDelay: 50,
                duration: 400
            });
        }
    },
    
    // Сценарій для форми
    formValidation: {
        success: (element) => {
            return window.animationManager.animate(element, 'bounce', { duration: 500 });
        },
        error: (element) => {
            return window.animationManager.animate(element, 'shake', { duration: 400 });
        }
    },
    
    // Сценарій для кошика
    cartAnimation: {
        addItem: (element) => {
            return window.animationManager.animate(element, 'pulse', { duration: 300 });
        },
        removeItem: (element) => {
            return window.animationManager.animate(element, 'scaleOut', { duration: 200 });
        },
        updateCount: (element) => {
            return window.animationManager.animate(element, 'bounce', { duration: 400 });
        }
    },
    
    // Сценарій для модальних вікон
    modal: {
        open: (backdrop, content) => {
            return Promise.all([
                window.animationManager.animate(backdrop, 'fadeIn', { duration: 200 }),
                window.animationManager.animate(content, 'scaleIn', { duration: 300 })
            ]);
        },
        close: (backdrop, content) => {
            return Promise.all([
                window.animationManager.animate(content, 'scaleOut', { duration: 200 }),
                window.animationManager.animate(backdrop, 'fadeOut', { duration: 300 })
            ]);
        }
    },
    
    // Сценарій для переходів між сторінками
    pageTransition: {
        out: (element) => {
            return window.animationManager.animate(element, 'slideInLeft', { duration: 300 });
        },
        in: (element) => {
            return window.animationManager.animate(element, 'slideInRight', { duration: 300 });
        }
    }
};

// Global animation manager instance
let animationManagerInstance = null;

/**
 * Get or create global animation manager instance
 */
export function getAnimationManager() {
    if (!animationManagerInstance) {
        animationManagerInstance = new AnimationManager();
        
        // Make it globally available
        if (typeof window !== 'undefined') {
            window.animationManager = animationManagerInstance;
        }
    }
    
    return animationManagerInstance;
}

/**
 * Initialize animation manager with custom config
 */
export function initAnimationManager(config = {}) {
    const manager = getAnimationManager();
    manager.updateConfig(config);
    return manager;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    getAnimationManager();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        getAnimationManager();
    });
}

export default AnimationManager;