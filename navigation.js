// ===== NAVIGATION.JS - МЕНЕДЖЕР НАВІГАЦІЇ =====

import { Utils } from './utils.js';
import { CONFIG, ANALYTICS_EVENTS } from './config.js';

export class NavigationManager {
    constructor() {
        // DOM elements
        this.header = Utils.$('.header');
        this.mobileMenuToggle = Utils.$('.mobile-menu-toggle');
        this.navMenu = Utils.$('#nav-menu');
        this.navLinks = Utils.$$('.nav-link');
        this.body = document.body;
        
        // State
        this.isMenuOpen = false;
        this.lastScrollY = window.scrollY;
        this.isScrollingDown = false;
        this.scrollThreshold = 100;
        this.hideHeaderOnScroll = false; // Можна ввімкнути для автоприховування
        
        // Touch events for mobile
        this.touchStartY = 0;
        this.touchEndY = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setInitialState();
        this.handleScroll();
        this.setActiveLink();
        
        console.log('🧭 Navigation Manager initialized');
    }
    
    bindEvents() {
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            Utils.on(this.mobileMenuToggle, 'click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }
        
        // Navigation links
        this.navLinks.forEach(link => {
            Utils.on(link, 'click', (e) => this.handleNavClick(e));
            
            // Keyboard navigation
            Utils.on(link, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleNavClick(e);
                }
            });
        });
        
        // Scroll events with throttling for performance
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
            this.setActiveLink();
        }, 16)); // ~60fps
        
        // Resize events
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && this.shouldCloseMenu(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
        
        // Touch events for mobile gestures
        if (Utils.isTouchDevice()) {
            this.bindTouchEvents();
        }
        
        // Hash change events
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }
    
    setInitialState() {
        // Set initial ARIA attributes
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
            this.mobileMenuToggle.setAttribute('aria-controls', 'nav-menu');
        }
        
        if (this.navMenu) {
            this.navMenu.setAttribute('aria-hidden', 'true');
        }
        
        // Handle initial hash if present
        if (window.location.hash) {
            setTimeout(() => this.handleHashChange(), 500);
        }
    }
    
    bindTouchEvents() {
        // Swipe to close menu
        Utils.on(this.navMenu, 'touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        Utils.on(this.navMenu, 'touchmove', (e) => {
            this.touchEndY = e.touches[0].clientY;
        }, { passive: true });
        
        Utils.on(this.navMenu, 'touchend', () => {
            const swipeDistance = this.touchStartY - this.touchEndY;
            const minSwipeDistance = 50;
            
            // Swipe up to close menu
            if (swipeDistance > minSwipeDistance && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        }, { passive: true });
    }
    
    handleKeydown(e) {
        switch (e.key) {
            case 'Escape':
                if (this.isMenuOpen) {
                    this.closeMobileMenu();
                    this.mobileMenuToggle?.focus();
                }
                break;
                
            case 'Tab':
                if (this.isMenuOpen) {
                    this.handleTabNavigation(e);
                }
                break;
                
            case 'ArrowDown':
            case 'ArrowUp':
                if (this.isMenuOpen && document.activeElement.classList.contains('nav-link')) {
                    e.preventDefault();
                    this.navigateWithArrows(e.key);
                }
                break;
        }
    }
    
    handleTabNavigation(e) {
        const focusableElements = this.navMenu.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
    
    navigateWithArrows(direction) {
        const currentIndex = Array.from(this.navLinks).indexOf(document.activeElement);
        let nextIndex;
        
        if (direction === 'ArrowDown') {
            nextIndex = currentIndex < this.navLinks.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : this.navLinks.length - 1;
        }
        
        this.navLinks[nextIndex].focus();
    }
    
    shouldCloseMenu(target) {
        return this.navMenu && 
               !this.navMenu.contains(target) && 
               this.mobileMenuToggle && 
               !this.mobileMenuToggle.contains(target);
    }
    
    toggleMobileMenu() {
        this.isMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
    }
    
    openMobileMenu() {
        if (this.isMenuOpen) return;
        
        this.isMenuOpen = true;
        
        // Update DOM
        if (this.navMenu) {
            this.navMenu.classList.add('active');
            this.navMenu.setAttribute('aria-hidden', 'false');
        }
        
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.classList.add('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
        }
        
        // Prevent body scroll
        this.body.style.overflow = 'hidden';
        this.body.classList.add('menu-open');
        
        // Animate hamburger
        this.animateHamburger(true);
        
        // Focus management
        this.setMenuFocus();
        
        // Add animation class
        requestAnimationFrame(() => {
            if (this.navMenu) {
                this.navMenu.classList.add('menu-opening');
            }
        });
        
        // Analytics
        this.trackEvent(ANALYTICS_EVENTS.MOBILE_MENU_OPENED);
        
        console.log('📱 Mobile menu opened');
    }
    
    closeMobileMenu() {
        if (!this.isMenuOpen) return;
        
        this.isMenuOpen = false;
        
        // Update DOM
        if (this.navMenu) {
            this.navMenu.classList.remove('active', 'menu-opening');
            this.navMenu.setAttribute('aria-hidden', 'true');
        }
        
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.classList.remove('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
        
        // Restore body scroll
        this.body.style.overflow = '';
        this.body.classList.remove('menu-open');
        
        // Animate hamburger
        this.animateHamburger(false);
        
        console.log('📱 Mobile menu closed');
    }
    
    animateHamburger(isOpen) {
        if (!this.mobileMenuToggle) return;
        
        const lines = this.mobileMenuToggle.querySelectorAll('.hamburger-line');
        
        lines.forEach((line, index) => {
            if (isOpen) {
                switch (index) {
                    case 0:
                        line.style.transform = 'rotate(45deg) translate(5px, 5px)';
                        break;
                    case 1:
                        line.style.opacity = '0';
                        line.style.transform = 'scale(0)';
                        break;
                    case 2:
                        line.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                        break;
                }
            } else {
                line.style.transform = '';
                line.style.opacity = '';
            }
        });
    }
    
    setMenuFocus() {
        if (!this.navMenu) return;
        
        // Focus on first menu item
        const firstMenuItem = this.navMenu.querySelector('.nav-link');
        if (firstMenuItem) {
            // Delay focus to ensure menu is fully opened
            setTimeout(() => {
                firstMenuItem.focus();
            }, 150);
        }
    }
    
    handleNavClick(e) {
        const link = e.target.closest('.nav-link');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Handle anchor links
        if (href && href.startsWith('#')) {
            e.preventDefault();
            
            const targetId = href.substring(1);
            const target = Utils.$(`#${targetId}`);
            
            if (target) {
                this.scrollToSection(target, targetId);
                this.closeMobileMenu();
                
                // Update URL without triggering scroll
                this.updateURL(href);
                
                // Analytics
                this.trackEvent(ANALYTICS_EVENTS.NAVIGATION_CLICK, {
                    section: targetId,
                    from_mobile_menu: this.isMenuOpen
                });
            }
        }
        
        // Handle external links
        else if (href && (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))) {
            // Let the browser handle these normally
            this.closeMobileMenu();
            
            this.trackEvent(ANALYTICS_EVENTS.EXTERNAL_LINK_CLICK, {
                url: href,
                type: href.startsWith('mailto:') ? 'email' : 
                      href.startsWith('tel:') ? 'phone' : 'external'
            });
        }
    }
    
    scrollToSection(target, sectionId) {
        const headerHeight = this.header ? this.header.offsetHeight : CONFIG.ui.scrollOffset;
        const targetTop = target.offsetTop - headerHeight - 20; // Extra 20px padding
        
        // Smooth scroll with easing
        this.smoothScrollTo(targetTop);
        
        // Update active link immediately for better UX
        this.setActiveSection(sectionId);
    }
    
    smoothScrollTo(targetY) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = 800; // ms
        let startTime = null;
        
        const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };
        
        const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const ease = easeInOutCubic(progress);
            
            window.scrollTo(0, startY + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    updateURL(hash) {
        if (history.pushState) {
            history.pushState(null, null, hash);
        } else {
            location.hash = hash;
        }
    }
    
    handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const target = Utils.$(hash);
            if (target) {
                setTimeout(() => {
                    this.scrollToSection(target, hash.substring(1));
                }, 100);
            }
        }
    }
    
    handleResize() {
        const isDesktop = window.innerWidth > CONFIG.ui.tabletBreakpoint;
        
        // Close mobile menu on desktop
        if (isDesktop && this.isMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Update header height CSS custom property
        if (this.header) {
            document.documentElement.style.setProperty(
                '--header-height', 
                `${this.header.offsetHeight}px`
            );
        }
    }
    
    handleScroll() {
        const currentScrollY = window.pageYOffset;
        const scrollDifference = currentScrollY - this.lastScrollY;
        
        // Update scroll direction
        this.isScrollingDown = scrollDifference > 0;
        
        // Header background change
        this.updateHeaderAppearance(currentScrollY);
        
        // Hide/show header on scroll (if enabled)
        if (this.hideHeaderOnScroll) {
            this.updateHeaderVisibility(currentScrollY);
        }
        
        this.lastScrollY = currentScrollY;
    }
    
    updateHeaderAppearance(scrollY) {
        if (!this.header) return;
        
        if (scrollY > this.scrollThreshold) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }
        
        // Add scroll progress indicator
        const scrollPercent = Math.min(scrollY / (document.body.scrollHeight - window.innerHeight), 1);
        this.header.style.setProperty('--scroll-progress', scrollPercent);
    }
    
    updateHeaderVisibility(scrollY) {
        if (!this.header) return;
        
        const isScrollingDown = this.isScrollingDown;
        const isAtTop = scrollY < this.scrollThreshold;
        const hasScrolledFar = scrollY > 200;
        
        if (isAtTop) {
            // Always show header at top
            this.header.style.transform = 'translateY(0)';
        } else if (isScrollingDown && hasScrolledFar && !this.isMenuOpen) {
            // Hide header when scrolling down (but not if menu is open)
            this.header.style.transform = 'translateY(-100%)';
        } else if (!isScrollingDown) {
            // Show header when scrolling up
            this.header.style.transform = 'translateY(0)';
        }
    }
    
    setActiveLink() {
        const sections = Utils.$('section[id]');
        const scrollPos = window.pageYOffset + CONFIG.ui.scrollOffset + 50;
        
        let activeSection = '';
        
        // Find the section that's currently in view
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                activeSection = section.getAttribute('id');
            }
        });
        
        // Special case for bottom of page
        if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 100) {
            const lastSection = sections[sections.length - 1];
            if (lastSection) {
                activeSection = lastSection.getAttribute('id');
            }
        }
        
        this.setActiveSection(activeSection);
    }
    
    setActiveSection(sectionId) {
        // Update navigation links
        this.navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${sectionId}`;
            
            link.classList.toggle('active', isActive);
            link.removeAttribute('aria-current');
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            }
        });
        
        // Update page title if needed
        this.updatePageTitle(sectionId);
        
        // Trigger custom event for other components
        Utils.triggerEvent(document, 'section-changed', { 
            activeSection: sectionId,
            timestamp: Date.now()
        });
    }
    
    updatePageTitle(sectionId) {
        if (!sectionId) return;
        
        const sectionTitles = {
            'home': 'Ковчег Ноя - Головна',
            'about': 'Ковчег Ноя - Про нас',
            'menu': 'Ковчег Ноя - Меню',
            'delivery': 'Ковчег Ноя - Доставка',
            'contact': 'Ковчег Ноя - Контакти'
        };
        
        const newTitle = sectionTitles[sectionId] || document.title;
        
        if (document.title !== newTitle) {
            document.title = newTitle;
        }
    }
    
    // Public API methods
    
    /**
     * Програмно перейти до секції
     * @param {string} sectionId - ID секції
     * @param {boolean} updateHistory - Чи оновлювати історію браузера
     */
    navigateToSection(sectionId, updateHistory = true) {
        const target = Utils.$(`#${sectionId}`);
        if (target) {
            this.scrollToSection(target, sectionId);
            
            if (updateHistory) {
                this.updateURL(`#${sectionId}`);
            }
            
            this.closeMobileMenu();
        }
    }
    
    /**
     * Отримати поточну активну секцію
     * @returns {string|null} ID активної секції
     */
    getCurrentSection() {
        const activeLink = Utils.$('.nav-link.active');
        if (activeLink) {
            const href = activeLink.getAttribute('href');
            return href ? href.substring(1) : null;
        }
        return null;
    }
    
    /**
     * Перевірити, чи відкрите мобільне меню
     * @returns {boolean}
     */
    isMobileMenuOpen() {
        return this.isMenuOpen;
    }
    
    /**
     * Ввімкнути/вимкнути автоприховування хедера при скролі
     * @param {boolean} enabled
     */
    setAutoHideHeader(enabled) {
        this.hideHeaderOnScroll = enabled;
        
        if (!enabled && this.header) {
            this.header.style.transform = 'translateY(0)';
        }
    }
    
    /**
     * Додати новий пункт навігації
     * @param {Object} options - Опції нового пункту
     */
    addNavigationItem(options) {
        const { href, text, position = 'end', className = '' } = options;
        
        if (!this.navMenu) return;
        
        const newItem = Utils.createElement('li');
        const newLink = Utils.createElement('a', {
            href: href,
            className: `nav-link ${className}`.trim(),
            textContent: text
        });
        
        newItem.appendChild(newLink);
        
        if (position === 'start') {
            this.navMenu.insertBefore(newItem, this.navMenu.firstChild);
        } else {
            this.navMenu.appendChild(newItem);
        }
        
        // Bind events to new link
        Utils.on(newLink, 'click', (e) => this.handleNavClick(e));
        
        // Update navLinks collection
        this.navLinks = Utils.$('.nav-link');
    }
    
    /**
     * Видалити пункт навігації
     * @param {string} href - href пункту для видалення
     */
    removeNavigationItem(href) {
        const link = Utils.$(`a.nav-link[href="${href}"]`);
        if (link && link.parentElement) {
            link.parentElement.remove();
            this.navLinks = Utils.$('.nav-link');
        }
    }
    
    /**
     * Встановити активний пункт навігації
     * @param {string} href - href пункту
     */
    setActiveNavigationItem(href) {
        this.navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === href;
            link.classList.toggle('active', isActive);
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }
    
    /**
     * Отримати всі пункти навігації
     * @returns {Array} Масив об'єктів з інформацією про пункти
     */
    getNavigationItems() {
        return Array.from(this.navLinks).map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent.trim(),
            isActive: link.classList.contains('active'),
            element: link
        }));
    }
    
    /**
     * Додати індикатор завантаження до навігації
     * @param {boolean} show - Показати/сховати індикатор
     */
    showLoadingIndicator(show = true) {
        if (!this.header) return;
        
        let indicator = this.header.querySelector('.nav-loading');
        
        if (show && !indicator) {
            indicator = Utils.createElement('div', {
                className: 'nav-loading',
                innerHTML: '<div class="loading-bar"></div>'
            });
            this.header.appendChild(indicator);
        } else if (!show && indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Встановити бейдж для пункту навігації
     * @param {string} href - href пункту
     * @param {string|number} count - Текст або число для бейджа
     */
    setBadge(href, count) {
        const link = Utils.$(`a.nav-link[href="${href}"]`);
        if (!link) return;
        
        let badge = link.querySelector('.nav-badge');
        
        if (count && count > 0) {
            if (!badge) {
                badge = Utils.createElement('span', {
                    className: 'nav-badge',
                    'aria-label': `${count} нових елементів`
                });
                link.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.display = 'inline-flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }
    
    /**
     * Встановити стан неактивності для пункту навігації
     * @param {string} href - href пункту
     * @param {boolean} disabled - Вимкнути/ввімкнути пункт
     */
    setNavigationItemDisabled(href, disabled = true) {
        const link = Utils.$(`a.nav-link[href="${href}"]`);
        if (!link) return;
        
        if (disabled) {
            link.classList.add('disabled');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1');
        } else {
            link.classList.remove('disabled');
            link.removeAttribute('aria-disabled');
            link.removeAttribute('tabindex');
        }
    }
    
    // Analytics and tracking
    trackEvent(eventName, data = {}) {
        if (window.analytics) {
            window.analytics.track(eventName, {
                ...data,
                component: 'navigation',
                timestamp: Date.now()
            });
        }
    }
    
    // Cleanup method
    destroy() {
        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('hashchange', this.handleHashChange);
        document.removeEventListener('click', this.handleNavClick);
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Reset DOM state
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Clear references
        this.header = null;
        this.mobileMenuToggle = null;
        this.navMenu = null;
        this.navLinks = null;
        
        console.log('🧭 Navigation Manager destroyed');
    }
    
    // Debug methods for development
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group('🧭 Navigation Debug Info');
        console.log('Is mobile menu open:', this.isMenuOpen);
        console.log('Current section:', this.getCurrentSection());
        console.log('Last scroll Y:', this.lastScrollY);
        console.log('Is scrolling down:', this.isScrollingDown);
        console.log('Navigation items:', this.getNavigationItems());
        console.log('Header element:', this.header);
        console.log('Mobile breakpoint:', Utils.isMobile());
        console.groupEnd();
    }
    
    // Performance monitoring
    getPerformanceMetrics() {
        return {
            scrollEventCount: this._scrollEventCount || 0,
            lastScrollTime: this._lastScrollTime || 0,
            menuToggleCount: this._menuToggleCount || 0,
            navigationClickCount: this._navigationClickCount || 0
        };
    }
}

// Navigation utility functions
export class NavigationUtils {
    /**
     * Створити breadcrumb навігацію
     * @param {Array} items - Масив елементів breadcrumb
     * @param {HTMLElement} container - Контейнер для breadcrumb
     */
    static createBreadcrumb(items, container) {
        if (!container) return;
        
        container.innerHTML = '';
        container.className = 'breadcrumb';
        container.setAttribute('aria-label', 'Breadcrumb навігація');
        
        const list = Utils.createElement('ol', {
            className: 'breadcrumb-list'
        });
        
        items.forEach((item, index) => {
            const listItem = Utils.createElement('li', {
                className: 'breadcrumb-item'
            });
            
            if (index === items.length - 1) {
                // Last item (current page)
                listItem.innerHTML = `<span aria-current="page">${item.text}</span>`;
            } else {
                // Navigation item
                listItem.innerHTML = `<a href="${item.href}">${item.text}</a>`;
            }
            
            list.appendChild(listItem);
        });
        
        container.appendChild(list);
    }
    
    /**
     * Створити міні навігацію для мобільних пристроїв
     * @param {HTMLElement} container - Контейнер для міні навігації
     */
    static createMiniNavigation(container) {
        if (!container) return;
        
        const miniNav = Utils.createElement('div', {
            className: 'mini-navigation',
            innerHTML: `
                <button class="mini-nav-btn" data-direction="prev" aria-label="Попередня секція">
                    <span aria-hidden="true">←</span>
                </button>
                <span class="mini-nav-indicator"></span>
                <button class="mini-nav-btn" data-direction="next" aria-label="Наступна секція">
                    <span aria-hidden="true">→</span>
                </button>
            `
        });
        
        container.appendChild(miniNav);
        
        // Add functionality
        const prevBtn = miniNav.querySelector('[data-direction="prev"]');
        const nextBtn = miniNav.querySelector('[data-direction="next"]');
        
        Utils.on(prevBtn, 'click', () => this.navigateToPreviousSection());
        Utils.on(nextBtn, 'click', () => this.navigateToNextSection());
        
        return miniNav;
    }
    
    /**
     * Перейти до попередньої секції
     */
    static navigateToPreviousSection() {
        const sections = Array.from(Utils.$('section[id]'));
        const currentSection = sections.find(section => 
            Utils.isInViewport(section, 100)
        );
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            const prevSection = sections[currentIndex - 1];
            
            if (prevSection) {
                Utils.scrollTo(prevSection);
            }
        }
    }
    
    /**
     * Перейти до наступної секції
     */
    static navigateToNextSection() {
        const sections = Array.from(Utils.$('section[id]'));
        const currentSection = sections.find(section => 
            Utils.isInViewport(section, 100)
        );
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            const nextSection = sections[currentIndex + 1];
            
            if (nextSection) {
                Utils.scrollTo(nextSection);
            }
        }
    }
    
    /**
     * Створити плаваючу кнопку "Наверх"
     * @param {Object} options - Опції кнопки
     */
    static createScrollToTopButton(options = {}) {
        const {
            text = 'Наверх',
            className = 'scroll-to-top',
            showAfter = 300,
            container = document.body
        } = options;
        
        const button = Utils.createElement('button', {
            className: className,
            'aria-label': text,
            innerHTML: `<span aria-hidden="true">↑</span><span class="sr-only">${text}</span>`
        });
        
        container.appendChild(button);
        
        // Show/hide based on scroll position
        const toggleButton = Utils.throttle(() => {
            const show = window.pageYOffset > showAfter;
            button.classList.toggle('visible', show);
        }, 100);
        
        window.addEventListener('scroll', toggleButton);
        
        // Click handler
        Utils.on(button, 'click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        return button;
    }
}

// Export for use in other modules
export default NavigationManager;