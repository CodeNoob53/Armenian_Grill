/**
 * Ковчег Ноя - Main JavaScript File
 * Вірменська кухня та шаурма в Запоріжжі
 * Author: Developer Team
 * Version: 1.0.0
 */

'use strict';

// ===== CONFIGURATION & CONSTANTS =====
const CONFIG = {
    // API endpoints
    API_BASE_URL: 'https://api.noahs-ark.com.ua',
    DELIVERY_API: 'https://delivery.noahs-ark.com.ua',
    
    // Contact information
    PHONE_NUMBER: '+380671234567',
    EMAIL: 'info@noahs-ark.com.ua',
    ADDRESS: 'вул. Лермонтова, 19, м. Запоріжжя',
    
    // Business hours
    WORKING_HOURS: {
        open: '09:00',
        close: '23:00',
        deliveryClose: '22:30'
    },
    
    // Delivery settings
    DELIVERY: {
        freeDeliveryMinAmount: 300,
        deliveryFee: 30,
        maxDeliveryTime: 30,
        avgDeliveryTime: 20
    },
    
    // Animation settings
    ANIMATION: {
        duration: 300,
        easing: 'ease-in-out',
        scrollOffset: 100
    },
    
    // Form validation
    VALIDATION: {
        phone: /^(\+38)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        name: /^[a-zA-Zа-яА-ЯіІїЇєЄ'\s]{2,50}$/
    }
};

// Menu data from Excel file
const MENU_DATA = {
    shawarma: [
        {
            id: 'shawarma-chicken',
            name: 'Шаурма Курка',
            description: 'Соковита курка, мариновані овочі, свіжа зелень та фірмовий соус у м\'якому лаваші',
            image: 'images/shawarma-chicken.jpg',
            rating: 4.9,
            popular: true,
            sizes: [
                { name: 'Мала', price: 115 },
                { name: 'Звичайна', price: 125 },
                { name: 'Подвійна', price: 160 }
            ]
        },
        {
            id: 'shawarma-pork',
            name: 'Шаурма Свинина',
            description: 'Ніжна свинина з пікантним маринадом, свіжі овочі та авторський соус',
            image: 'images/shawarma-pork.jpg',
            rating: 4.8,
            sizes: [
                { name: 'Мала', price: 120 },
                { name: 'Звичайна', price: 130 },
                { name: 'Подвійна', price: 170 }
            ]
        },
        {
            id: 'shawarma-beef',
            name: 'Шаурма Телятина',
            description: 'Преміум телятина, особливий маринад, овочі гриль та трюфельний соус',
            image: 'images/shawarma-beef.jpg',
            rating: 4.9,
            premium: true,
            sizes: [
                { name: 'Мала', price: 125 },
                { name: 'Звичайна', price: 135 },
                { name: 'Подвійна', price: 180 }
            ]
        },
        {
            id: 'shawarma-veggie',
            name: 'Шаурма Овочева',
            description: 'Свіжі овочі гриль, хумус та вірменські спеції',
            image: 'images/shawarma-veggie.jpg',
            rating: 4.7,
            vegetarian: true,
            sizes: [
                { name: 'Звичайна', price: 100 }
            ]
        }
    ],
    kebab: [
        {
            id: 'kebab-chicken',
            name: 'Люля-кебаб Курка',
            description: 'Соковитий кебаб з курячого фаршу з вірменськими спеціями',
            image: 'images/kebab-chicken.jpg',
            rating: 4.8,
            price: 100
        },
        {
            id: 'kebab-pork',
            name: 'Люля-кебаб Свинина',
            description: 'Класичний кебаб зі свинячого фаршу за автентичним рецептом',
            image: 'images/kebab-pork.jpg',
            rating: 4.9,
            price: 110
        },
        {
            id: 'kebab-beef',
            name: 'Люля-кебаб Телятина',
            description: 'Преміум кебаб з телячого фаршу з трюфельним соусом',
            image: 'images/kebab-beef.jpg',
            rating: 4.9,
            premium: true,
            price: 120
        },
        {
            id: 'kebab-mix',
            name: 'Люля-кебаб Асорті',
            description: 'Мікс з курки, свинини та телятини з різними соусами',
            image: 'images/kebab-mix.jpg',
            rating: 4.8,
            price: 130
        }
    ],
    grill: [
        {
            id: 'grill-chicken-breast',
            name: 'Куряче філе гриль',
            description: 'Соковите куряче філе з вірменськими травами',
            image: 'images/grill-chicken.jpg',
            rating: 4.7,
            price: 150
        },
        {
            id: 'grill-pork-ribs',
            name: 'Свинячі ребра гриль',
            description: 'Ніжні ребра з медово-гірчичним соусом',
            image: 'images/grill-ribs.jpg',
            rating: 4.8,
            price: 180
        },
        {
            id: 'grill-vegetables',
            name: 'Овочі гриль',
            description: 'Сезонні овочі з оливковою олією та травами',
            image: 'images/grill-vegetables.jpg',
            rating: 4.6,
            vegetarian: true,
            price: 90
        }
    ],
    burgers: [
        {
            id: 'burger-armenian',
            name: 'Вірменський бургер',
            description: 'Бургер з люля-кебабом, сиром сулугуні та вірменським соусом',
            image: 'images/burger-armenian.jpg',
            rating: 4.8,
            popular: true,
            price: 160
        },
        {
            id: 'burger-classic',
            name: 'Класичний бургер',
            description: 'Яловича котлета, сир, овочі та фірмовий соус',
            image: 'images/burger-classic.jpg',
            rating: 4.7,
            price: 140
        },
        {
            id: 'burger-chicken',
            name: 'Чікен бургер',
            description: 'Куряча котлета, бекон, сир чеддер та BBQ соус',
            image: 'images/burger-chicken.jpg',
            rating: 4.6,
            price: 135
        }
    ]
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Debounce function for performance optimization
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format phone number
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('38')) {
            return '+38 (' + cleaned.substring(2, 5) + ') ' + 
                   cleaned.substring(5, 8) + '-' + 
                   cleaned.substring(8, 10) + '-' + 
                   cleaned.substring(10, 12);
        }
        return phone;
    },

    // Format currency
    formatCurrency(amount) {
        return amount.toLocaleString('uk-UA') + ' ₴';
    },

    // Get element with error handling
    getElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
            return null;
        }
        return element;
    },

    // Add event listener with error handling
    addEventListenerSafe(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
            return true;
        }
        console.warn('Failed to add event listener:', { element, event, handler });
        return false;
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Generate unique ID
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    // Local storage helpers
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Storage set failed:', e);
                return false;
            }
        },
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.warn('Storage get failed:', e);
                return null;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('Storage remove failed:', e);
                return false;
            }
        }
    }
};

// ===== MAIN APPLICATION CLASS =====
class NoahsArkApp {
    constructor() {
        this.isLoaded = false;
        this.cart = Utils.storage.get('cart') || [];
        this.currentMenuCategory = 'shawarma';
        
        // Bind methods
        this.handleScroll = Utils.throttle(this.handleScroll.bind(this), 16);
        this.handleResize = Utils.debounce(this.handleResize.bind(this), 250);
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Initialize application
    init() {
        try {
            console.log('🚀 Ковчег Ноя - Initializing...');
            
            this.initializeElements();
            this.initializeEventListeners();
            this.initializeComponents();
            this.loadInitialData();
            this.startPerformanceMonitoring();
            
            this.isLoaded = true;
            console.log('✅ Ковчег Ноя - Ready!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showErrorMessage('Помилка ініціалізації. Спробуйте оновити сторінку.');
        }
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            // Header elements
            header: Utils.getElement('.header'),
            mobileMenuToggle: Utils.getElement('.mobile-menu-toggle'),
            navMenu: Utils.getElement('#nav-menu'),
            navLinks: document.querySelectorAll('.nav-link'),
            
            // Menu elements
            menuTabs: document.querySelectorAll('.tab-btn'),
            menuPanels: document.querySelectorAll('.menu-panel'),
            dishesGrid: Utils.getElement('.dishes-grid'),
            
            // Cart elements
            cartSidebar: Utils.getElement('#cart-sidebar'),
            cartClose: Utils.getElement('.cart-close'),
            orderButtons: document.querySelectorAll('.order-btn, .cta-primary'),
            addButtons: document.querySelectorAll('.add-btn'),
            
            // Form elements
            contactForm: Utils.getElement('.contact-form'),
            formInputs: document.querySelectorAll('.form-input, .form-textarea'),
            
            // Other elements
            heroStats: document.querySelectorAll('.stat-number'),
            loadingOverlay: Utils.getElement('#loading-overlay'),
            toastContainer: Utils.getElement('#toast-container')
        };
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Window events
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('load', () => this.onPageLoad());
        
        // Navigation
        if (this.elements.mobileMenuToggle) {
            this.elements.mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Menu tabs
        this.elements.menuTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchMenuTab(tab));
        });
        
        // Cart functionality
        if (this.elements.cartClose) {
            this.elements.cartClose.addEventListener('click', () => this.closeCart());
        }
        
        this.elements.orderButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleOrderClick());
        });
        
        // Form handling
        if (this.elements.contactForm) {
            this.elements.contactForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        this.elements.formInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Cart outside click
        document.addEventListener('click', (e) => {
            if (this.elements.cartSidebar && 
                this.elements.cartSidebar.classList.contains('open') && 
                !this.elements.cartSidebar.contains(e.target) && 
                !e.target.closest('.order-btn')) {
                this.closeCart();
            }
        });
    }

    // Initialize components
    initializeComponents() {
        this.initializeAnimations();
        this.initializeIntersectionObserver();
        this.updateWorkingHours();
        this.renderMenu();
        this.updateCartUI();
    }

    // Load initial data
    loadInitialData() {
        // Simulate loading user preferences
        const savedTheme = Utils.storage.get('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
        
        // Load cart from storage
        this.updateCartCount();
        
        // Check if restaurant is open
        this.checkRestaurantStatus();
    }

    // Start performance monitoring
    startPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('web-vital' in window) {
            import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(console.log);
                getFID(console.log);
                getFCP(console.log);
                getLCP(console.log);
                getTTFB(console.log);
            });
        }
        
        // Log page load time
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }, 0);
        });
    }

    // Handle scroll events
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Header scroll effect
        if (this.elements.header) {
            if (scrollY > 100) {
                this.elements.header.classList.add('scrolled');
            } else {
                this.elements.header.classList.remove('scrolled');
            }
        }
        
        // Update active navigation
        this.updateActiveNavigation();
        
        // Trigger scroll animations
        this.triggerScrollAnimations();
    }

    // Handle resize events
    handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 992 && this.elements.navMenu) {
            this.elements.navMenu.classList.remove('open');
            this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
        
        // Recalculate animations
        this.recalculateAnimations();
    }

    // Handle page load
    onPageLoad() {
        // Hide loading overlay
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('show');
        }
        
        // Start counter animations
        this.animateCounters();
        
        // Trigger initial animations
        this.triggerInitialAnimations();
    }

    // Toggle mobile menu
    toggleMobileMenu() {
        if (!this.elements.navMenu || !this.elements.mobileMenuToggle) return;
        
        const isOpen = this.elements.navMenu.classList.contains('open');
        
        if (isOpen) {
            this.elements.navMenu.classList.remove('open');
            this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        } else {
            this.elements.navMenu.classList.add('open');
            this.elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }

    // Handle navigation clicks
    handleNavClick(e) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            const targetElement = Utils.getElement(href);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu
                if (this.elements.navMenu && this.elements.navMenu.classList.contains('open')) {
                    this.toggleMobileMenu();
                }
                
                // Update active state
                this.updateActiveNavLink(e.target);
            }
        }
    }

    // Update active navigation
    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                const activeLink = Utils.getElement(`a[href="#${sectionId}"]`);
                if (activeLink) {
                    this.updateActiveNavLink(activeLink);
                }
            }
        });
    }

    // Update active nav link
    updateActiveNavLink(activeLink) {
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }

    // Switch menu tab
    switchMenuTab(activeTab) {
        const tabName = activeTab.getAttribute('aria-controls') || activeTab.textContent.toLowerCase().trim();
        
        // Update tab states
        this.elements.menuTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        
        // Update panel visibility
        this.elements.menuPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show corresponding panel
        const targetPanel = Utils.getElement(`#${tabName}-panel`) || this.elements.menuPanels[0];
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        
        // Update current category and render menu
        this.currentMenuCategory = this.getMenuCategoryFromTab(activeTab);
        this.renderMenuCategory(this.currentMenuCategory);
    }

    // Get menu category from tab
    getMenuCategoryFromTab(tab) {
        const tabText = tab.textContent.toLowerCase().trim();
        const categoryMap = {
            'шаурма': 'shawarma',
            'кебаб': 'kebab',
            'гриль': 'grill',
            'бургери': 'burgers'
        };
        return categoryMap[tabText] || 'shawarma';
    }

    // Render menu
    renderMenu() {
        this.renderMenuCategory(this.currentMenuCategory);
    }

    // Render menu category
    renderMenuCategory(category) {
        if (!this.elements.dishesGrid) return;
        
        const dishes = MENU_DATA[category] || [];
        
        this.elements.dishesGrid.innerHTML = dishes.map(dish => this.renderDishCard(dish)).join('');
        
        // Re-attach event listeners for new elements
        this.attachDishEventListeners();
        
        // Trigger animations
        this.triggerMenuAnimations();
    }

    // Render dish card
    renderDishCard(dish) {
        const badgeHtml = dish.popular ? '<div class="dish-badge">Хіт продажів</div>' :
                         dish.premium ? '<div class="dish-badge premium">Преміум</div>' :
                         dish.vegetarian ? '<div class="dish-badge" style="background: var(--secondary-green)">Вегетаріанське</div>' : '';
        
        const sizesHtml = dish.sizes ? dish.sizes.map(size => `
            <div class="size-option">
                <span class="size-label">${size.name}</span>
                <span class="size-price">${Utils.formatCurrency(size.price)}</span>
            </div>
        `).join('') : `<div class="size-option">
            <span class="size-label">Стандарт</span>
            <span class="size-price">${Utils.formatCurrency(dish.price)}</span>
        </div>`;
        
        const rating = '★'.repeat(Math.floor(dish.rating)) + 
                      (dish.rating % 1 ? '☆' : '') + 
                      '☆'.repeat(5 - Math.ceil(dish.rating));
        
        return `
            <article class="dish-card animate-on-scroll" data-dish-id="${dish.id}">
                <div class="dish-image">
                    <img src="${dish.image}" alt="${dish.name}" width="300" height="200" loading="lazy">
                    ${badgeHtml}
                </div>
                <div class="dish-content">
                    <div class="dish-rating" aria-label="Рейтинг ${dish.rating} зірок">
                        ${rating.split('').map((star, i) => 
                            `<span class="star ${star === '★' ? 'filled' : ''}" aria-hidden="true">${star}</span>`
                        ).join('')}
                        <span class="rating-text">(${dish.rating})</span>
                    </div>
                    <h3 class="dish-title">${dish.name}</h3>
                    <p class="dish-description">${dish.description}</p>
                    <div class="dish-sizes">
                        ${sizesHtml}
                    </div>
                    <button class="add-btn" data-dish-id="${dish.id}" aria-label="Додати ${dish.name} до кошика">
                        <span class="btn-text">Додати</span>
                        <span class="btn-icon" aria-hidden="true">+</span>
                    </button>
                </div>
            </article>
        `;
    }

    // Attach dish event listeners
    attachDishEventListeners() {
        const addButtons = document.querySelectorAll('.add-btn[data-dish-id]');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddToCart(e));
        });
    }

    // Handle add to cart
    handleAddToCart(e) {
        const dishId = e.currentTarget.getAttribute('data-dish-id');
        const dish = this.findDishById(dishId);
        
        if (!dish) {
            this.showToast('Помилка додавання до кошика', 'error');
            return;
        }
        
        // For dishes with multiple sizes, show size selector
        if (dish.sizes && dish.sizes.length > 1) {
            this.showSizeSelector(dish);
        } else {
            // Add directly
            const price = dish.sizes ? dish.sizes[0].price : dish.price;
            this.addToCart(dish, price);
        }
    }

    // Find dish by ID
    findDishById(dishId) {
        for (const category in MENU_DATA) {
            const dish = MENU_DATA[category].find(d => d.id === dishId);
            if (dish) return dish;
        }
        return null;
    }

    // Show size selector modal
    showSizeSelector(dish) {
        const modal = document.createElement('div');
        modal.className = 'size-selector-modal';
        modal.innerHTML = `
            <div class="size-selector-content">
                <h3>Оберіть розмір</h3>
                <h4>${dish.name}</h4>
                <div class="size-options">
                    ${dish.sizes.map((size, index) => `
                        <button class="size-option-btn" data-size-index="${index}">
                            <span class="size-name">${size.name}</span>
                            <span class="size-price">${Utils.formatCurrency(size.price)}</span>
                        </button>
                    `).join('')}
                </div>
                <button class="close-modal" aria-label="Закрити">×</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                document.body.removeChild(modal);
            }
            
            if (e.target.classList.contains('size-option-btn')) {
                const sizeIndex = parseInt(e.target.getAttribute('data-size-index'));
                const size = dish.sizes[sizeIndex];
                this.addToCart(dish, size.price, size.name);
                document.body.removeChild(modal);
            }
        });
        
        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // Add to cart
    addToCart(dish, price, sizeName = null) {
        const cartItem = {
            id: Utils.generateId(),
            dishId: dish.id,
            name: dish.name,
            price: price,
            size: sizeName,
            quantity: 1,
            image: dish.image
        };
        
        this.cart.push(cartItem);
        Utils.storage.set('cart', this.cart);
        
        this.updateCartUI();
        this.updateCartCount();
        this.showToast(`${dish.name} додано до кошика!`, 'success');
        
        // Animate button
        const btn = document.querySelector(`[data-dish-id="${dish.id}"]`);
        if (btn) {
            btn.classList.add('added');
            setTimeout(() => btn.classList.remove('added'), 1000);
        }

    }

    // Update cart UI
    updateCartUI() {
        // This would be implemented when cart sidebar is fully developed
        console.log('Cart updated:', this.cart);
    }

    // Update cart count
    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'block' : 'none';
        });
    }

    // Handle order click
    handleOrderClick() {
        if (this.cart.length > 0) {
            this.openCart();
        } else {
            // Scroll to menu
            const menuSection = Utils.getElement('#menu');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth' });
                this.showToast('Оберіть страви з нашого меню', 'info');
            }

        }
    }

    // Open cart
    openCart() {
        if (this.elements.cartSidebar) {
            this.elements.cartSidebar.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    // Close cart
    closeCart() {
        if (this.elements.cartSidebar) {
            this.elements.cartSidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!this.validateForm(data)) {
            this.showToast('Будь ласка, заповніть всі обов\'язкові поля', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            // Simulate API call
            await this.submitContactForm(data);
            
            this.showToast('Дякуємо! Ваше повідомлення відправлено.', 'success');
            e.target.reset();
            this.clearFormErrors();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showToast('Помилка відправки. Спробуйте пізніше.', 'error');
        } finally {
            // Hide loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    // Submit contact form
    async submitContactForm(data) {
        // This would be a real API call in production
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve({ success: true });
                } else {
                    reject(new Error('Server error'));
                }
            }, 2000);
        });
    }

    // Validate form
    validateForm(data) {
        let isValid = true;
        
        // Name validation
        if (!data.name || !CONFIG.VALIDATION.name.test(data.name)) {
            this.showFieldError('name', 'Введіть коректне ім\'я (2-50 символів)');
            isValid = false;
        }
        
        // Phone validation
        if (!data.phone || !CONFIG.VALIDATION.phone.test(data.phone)) {
            this.showFieldError('phone', 'Введіть коректний номер телефону');
            isValid = false;
        }
        
        // Email validation (optional)
        if (data.email && !CONFIG.VALIDATION.email.test(data.email)) {
            this.showFieldError('email', 'Введіть коректний email');
            isValid = false;
        }
        
        // Message validation
        if (!data.message || data.message.trim().length < 10) {
            this.showFieldError('message', 'Повідомлення має містити мінімум 10 символів');
            isValid = false;
        }
        
        return isValid;
    }

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        
        switch (fieldName) {
            case 'name':
                isValid = CONFIG.VALIDATION.name.test(value);
                if (!isValid) this.showFieldError(fieldName, 'Введіть коректне ім\'я');
                break;
                
            case 'phone':
                isValid = CONFIG.VALIDATION.phone.test(value);
                if (!isValid) this.showFieldError(fieldName, 'Введіть коректний номер телефону');
                break;
                
            case 'email':
                if (value) {
                    isValid = CONFIG.VALIDATION.email.test(value);
                    if (!isValid) this.showFieldError(fieldName, 'Введіть коректний email');
                }
                break;
                
            case 'message':
                isValid = value.length >= 10;
                if (!isValid) this.showFieldError(fieldName, 'Мінімум 10 символів');
                break;
        }
        
        if (isValid) {
            this.clearFieldError(fieldName);
        }
        
        return isValid;
    }

    // Show field error
    showFieldError(fieldName, message) {
        const field = Utils.getElement(`[name="${fieldName}"]`);
        const errorElement = Utils.getElement(`#${fieldName}-error`);
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear field error
    clearFieldError(fieldName) {
        const field = Utils.getElement(`[name="${fieldName}"]`);
        const errorElement = Utils.getElement(`#${fieldName}-error`);
        
        if (field) {
            field.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }

    // Clear all form errors
    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        const errorFields = document.querySelectorAll('.form-input.error, .form-textarea.error');
        
        errorElements.forEach(element => {
            element.classList.remove('show');
            element.textContent = '';
        });
        
        errorFields.forEach(field => {
            field.classList.remove('error');
        });
    }

    // Handle keyboard navigation
    handleKeyboard(e) {
        // Escape key
        if (e.key === 'Escape') {
            // Close cart
            if (this.elements.cartSidebar && this.elements.cartSidebar.classList.contains('open')) {
                this.closeCart();
                return;
            }
            
            // Close mobile menu
            if (this.elements.navMenu && this.elements.navMenu.classList.contains('open')) {
                this.toggleMobileMenu();
                return;
            }
        }
        
        // Enter key on buttons
        if (e.key === 'Enter' && e.target.classList.contains('tab-btn')) {
            e.target.click();
        }
    }

    // Initialize animations
    initializeAnimations() {
        // CSS animations are handled by CSS classes
        // This method can be extended for more complex animations
    }

    // Initialize intersection observer for scroll animations
    initializeIntersectionObserver() {
        if (!window.IntersectionObserver) return;
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Unobserve after animation to improve performance
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all animate-on-scroll elements
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            this.observer.observe(element);
        });
    }

    // Trigger scroll animations
    triggerScrollAnimations() {
        // Additional scroll-based animations can be added here
    }

    // Recalculate animations
    recalculateAnimations() {
        // Recalculate animation timings on resize
        // This method can be extended as needed
    }

    // Trigger initial animations
    triggerInitialAnimations() {
        // Hero animations
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('fade-in');
            }, index * 100);
        });
    }

    // Trigger menu animations
    triggerMenuAnimations() {
        const dishCards = document.querySelectorAll('.dish-card');
        dishCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animated');
            }, index * 50);
        });
    }

    // Animate counters
    animateCounters() {
        this.elements.heroStats.forEach(stat => {
            const finalValue = stat.textContent;
            const isNumber = /^\d+$/.test(finalValue);
            
            if (isNumber) {
                const finalNum = parseInt(finalValue);
                let currentNum = 0;
                const increment = finalNum / 60; // 60 frames animation
                
                const animate = () => {
                    currentNum += increment;
                    if (currentNum < finalNum) {
                        stat.textContent = Math.floor(currentNum);
                        requestAnimationFrame(animate);
                    } else {
                        stat.textContent = finalValue;
                    }
                };
                
                stat.textContent = '0';
                animate();
            }
        });
    }

    // Update working hours
    updateWorkingHours() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const openTime = this.parseTime(CONFIG.WORKING_HOURS.open);
        const closeTime = this.parseTime(CONFIG.WORKING_HOURS.close);
        
        const isOpen = currentTime >= openTime && currentTime <= closeTime;
        
        // Update status indicators
        const statusElements = document.querySelectorAll('.restaurant-status');
        statusElements.forEach(element => {
            element.textContent = isOpen ? 'Відкрито' : 'Закрито';
            element.className = `restaurant-status ${isOpen ? 'open' : 'closed'}`;
        });
    }

    // Parse time string to minutes
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Check restaurant status
    checkRestaurantStatus() {
        this.updateWorkingHours();
        
        // Update every minute
        setInterval(() => {
            this.updateWorkingHours();
        }, 60000);
    }

    // Show toast notification
    showToast(message, type = 'info') {
        if (!this.elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Закрити">×</button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    // Remove toast
    removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Show error message
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    // Show loading overlay
    showLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('show');
        }
    }

    // Hide loading overlay
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('show');
        }
    }

    // Analytics tracking
    trackEvent(eventName, eventData = {}) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, eventData);
        }
        
        // Console log for development
        console.log('Event tracked:', eventName, eventData);
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Track error
        this.trackEvent('error', {
            error_message: error.message,
            error_context: context
        });
        
        // Show user-friendly message
        this.showErrorMessage('Щось пішло не так. Спробуйте оновити сторінку.');
    }
}

// ===== SPECIALIZED COMPONENTS =====

// Phone number formatter component
class PhoneFormatter {
    constructor(input) {
        this.input = input;
        this.init();
    }
    
    init() {
        if (!this.input) return;
        
        this.input.addEventListener('input', (e) => {
            this.formatPhone(e);
        });
        
        this.input.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
    }
    
    formatPhone(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('38')) {
            value = value.substring(2);
        }
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
            } else if (value.length <= 8) {
                value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
            } else {
                value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 8)}-${value.substring(8, 10)}`;
            }
        }
        
        e.target.value = value;
    }
    
    handleKeydown(e) {
        // Allow special keys
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
        if (allowedKeys.includes(e.key)) return;
        
        // Allow numbers
        if (/\d/.test(e.key)) return;
        
        // Prevent other keys
        e.preventDefault();
    }
}

// Lazy loading component
class LazyLoader {
    constructor() {
        this.init();
    }
    
    init() {
        if (!window.IntersectionObserver) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }
    
    loadImage(img) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');
    }
    
    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    }
}

// Performance monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }
    
    init() {
        this.measurePageLoad();
        this.measureUserInteractions();
        this.monitorMemoryUsage();
    }
    
    measurePageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                this.metrics.pageLoad = {
                    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
                    tcp: perfData.connectEnd - perfData.connectStart,
                    request: perfData.responseStart - perfData.requestStart,
                    response: perfData.responseEnd - perfData.responseStart,
                    processing: perfData.domContentLoadedEventStart - perfData.responseEnd,
                    total: perfData.loadEventEnd - perfData.fetchStart
                };
                
                console.log('Page Load Metrics:', this.metrics.pageLoad);
            }, 0);
        });
    }
    
    measureUserInteractions() {
        ['click', 'scroll', 'keydown'].forEach(event => {
            document.addEventListener(event, () => {
                this.trackInteraction(event);
            }, { passive: true });
        });
    }
    
    trackInteraction(type) {
        if (!this.metrics.interactions) {
            this.metrics.interactions = {};
        }
        
        this.metrics.interactions[type] = (this.metrics.interactions[type] || 0) + 1;
    }
    
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                this.metrics.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }, 30000);
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
}

// ===== INITIALIZATION =====

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize main app
    app = new NoahsArkApp();
    
    // Initialize specialized components
    new LazyLoader();
    new PerformanceMonitor();
    
    // Initialize phone formatters
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        new PhoneFormatter(input);
    });
    
    // Service Worker registration
    if ('serviceWorker' in navigator && 'production' === 'production') {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }
    
    // Register for push notifications (optional)
    if ('Notification' in window && 'serviceWorker' in navigator) {
        // This would be implemented based on business requirements
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (app) {
        app.handleError(e.error, 'global');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (app) {
        app.handleError(e.reason, 'promise');
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NoahsArkApp, Utils, CONFIG };
}

// Debug helpers (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.app = app;
    window.utils = Utils;
    window.config = CONFIG;
    
    // Performance logging
    console.log('🐛 Debug mode enabled');
    console.log('📊 Use window.app.performanceMonitor.getMetrics() to see performance data');
}