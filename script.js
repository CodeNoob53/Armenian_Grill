// ===== ARMENIAN GRILL HOUSE JAVASCRIPT =====

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollEffects();
    initMenuFilter();
    initForms();
    initAnimations();
    initMobileMenu();
    initBackToTop();
    initLazyLoading();
    initPerformanceOptimizations();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                updateActiveNavLink(this);
                
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', throttle(updateActiveNavOnScroll, 100));
    
    function updateActiveNavOnScroll() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) {
                    updateActiveNavLink(activeLink);
                }
            }
        });
    }
    
    function updateActiveNavLink(activeLink) {
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', throttle(function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 10));
}

// ===== MENU FILTER =====
function initMenuFilter() {
    const filterButtons = document.querySelectorAll('.tab-btn');
    const dishCards = document.querySelectorAll('.dish-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter dishes with animation
            filterDishes(category, dishCards);
        });
    });
    
    function filterDishes(category, cards) {
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const shouldShow = category === 'all' || cardCategory === category;
            
            if (shouldShow) {
                card.style.display = 'block';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                // Animate in
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
}

// ===== FORMS =====
function initForms() {
    // Reservation form
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Add to cart buttons
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });
    
    // Order buttons
    const orderButtons = document.querySelectorAll('.order-btn, .cta-primary, .offer-btn');
    orderButtons.forEach(button => {
        if (!button.getAttribute('href')) {
            button.addEventListener('click', handleOrderClick);
        }
    });
    
    // Input validation
    initInputValidation();
}

function handleReservationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate required fields
    const requiredFields = ['name', 'phone', 'guests', 'date', 'time'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        showNotification('Будь ласка, заповніть всі обов\'язкові поля', 'error');
        return;
    }
    
    // Validate date (not in the past)
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('Будь ласка, оберіть дату не раніше сьогоднішнього дня', 'error');
        return;
    }
    
    // Simulate form submission
    showLoading(e.target.querySelector('.reserve-btn'));
    
    setTimeout(() => {
        hideLoading(e.target.querySelector('.reserve-btn'));
        showNotification('Дякуємо! Ваш столик забронований. Ми зв\'яжемося з вами для підтвердження.', 'success');
        e.target.reset();
        
        // Send to analytics
        trackEvent('reservation_submitted', {
            guests: data.guests,
            date: data.date,
            time: data.time
        });
    }, 2000);
}

function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    
    if (!isValidEmail(email)) {
        showNotification('Будь ласка, введіть коректну email адресу', 'error');
        return;
    }
    
    const button = e.target.querySelector('button');
    showLoading(button);
    
    setTimeout(() => {
        hideLoading(button);
        showNotification('Дякуємо за підписку! Ви будете отримувати наші новини та спеціальні пропозиції.', 'success');
        e.target.reset();
        
        trackEvent('newsletter_signup', { email: email });
    }, 1500);
}

function handleAddToCart(e) {
    const button = e.target.closest('.add-btn');
    const dishCard = button.closest('.dish-card');
    const dishTitle = dishCard.querySelector('.dish-title').textContent;
    const dishPrice = dishCard.querySelector('.price').textContent;
    
    // Animation
    button.innerHTML = '✓';
    button.style.background = '#198754';
    button.style.transform = 'scale(1.2)';
    
    setTimeout(() => {
        button.innerHTML = '+';
        button.style.background = '';
        button.style.transform = '';
    }, 1500);
    
    // Show notification
    showNotification(`"${dishTitle}" додано до кошика!`, 'success');
    
    // Track event
    trackEvent('add_to_cart', {
        item_name: dishTitle,
        price: dishPrice,
        category: dishCard.getAttribute('data-category')
    });
    
    // Update cart counter (if exists)
    updateCartCounter();
}

function handleOrderClick(e) {
    e.preventDefault();
    
    // Simulate order process
    showNotification('Перенаправлення до системи замовлень...', 'info');
    
    setTimeout(() => {
        // In real app, this would redirect to order system
        window.open('tel:+380441234567', '_self');
    }, 1000);
    
    trackEvent('order_button_clicked', {
        button_location: e.target.closest('section')?.id || 'unknown'
    });
}

function initInputValidation() {
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('38')) {
                value = value.substring(2);
            }
            
            if (value.length > 0) {
                value = '+380' + value.substring(0, 9);
            }
            
            e.target.value = value;
        });
    });
    
    // Date input minimum date
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        const today = new Date().toISOString().split('T')[0];
        input.setAttribute('min', today);
    });
    
    // Real-time email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function(e) {
            if (e.target.value && !isValidEmail(e.target.value)) {
                e.target.style.borderColor = '#dc3545';
                showTooltip(e.target, 'Введіть коректну email адресу');
            } else {
                e.target.style.borderColor = '';
                hideTooltip(e.target);
            }
        });
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Stagger animation for grids
                if (entry.target.matches('.dishes-grid, .offers-grid, .reviews-grid')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('animate-in');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(`
        .hero-content,
        .section-header,
        .about-content,
        .dish-card,
        .offer-card,
        .review-card,
        .feature-item,
        .stat-item
    `);
    
    animatedElements.forEach(el => {
        el.classList.add('animate-ready');
        observer.observe(el);
    });
    
    // Parallax effect for hero
    window.addEventListener('scroll', throttle(parallaxEffect, 16));
}

function parallaxEffect() {
    const scrolled = window.pageYOffset;
    const heroElements = document.querySelectorAll('.hero::before, .floating-elements');
    
    heroElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking on links
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
    
    function toggleMobileMenu() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Animate hamburger lines
        const spans = navToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
            span.style.transform = navMenu.classList.contains('active') 
                ? getHamburgerTransform(index) 
                : '';
        });
    }
    
    function getHamburgerTransform(index) {
        switch(index) {
            case 0: return 'rotate(45deg) translate(5px, 5px)';
            case 1: return 'scale(0)';
            case 2: return 'rotate(-45deg) translate(7px, -6px)';
            default: return '';
        }
    }
}

function closeMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    
    if (navMenu && navToggle) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
        
        const spans = navToggle.querySelectorAll('span');
        spans.forEach(span => {
            span.style.transform = '';
        });
    }
}

// ===== BACK TO TOP =====
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', throttle(function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, 100));
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            trackEvent('back_to_top_clicked');
        });
    }
}

// ===== LAZY LOADING =====
function initLazyLoading() {
    // Lazy load images when they exist
    const images = document.querySelectorAll('img[data-src]');
    
    if (images.length > 0) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function initPerformanceOptimizations() {
    // Preload critical resources
    preloadCriticalResources();
    
    // Initialize Service Worker for caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .catch(err => console.log('Service Worker registration failed'));
    }
    
    // Optimize font loading
    if ('fonts' in document) {
        document.fonts.ready.then(() => {
            document.body.classList.add('fonts-loaded');
        });
    }
}

function preloadCriticalResources() {
    const criticalResources = [
        // Add paths to critical images, fonts, etc.
        '/images/hero-shawarma.jpg',
        '/images/logo.png'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.endsWith('.jpg') || resource.endsWith('.png') ? 'image' : 'font';
        link.href = resource;
        document.head.appendChild(link);
    });
}

// ===== UTILITY FUNCTIONS =====

// Throttle function for performance
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounce function
function debounce(func, wait, immediate) {
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
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#198754';
        case 'error': return '#dc3545';
        case 'warning': return '#fd7e14';
        default: return '#0d6efd';
    }
}

// Show loading state
function showLoading(button) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<span class="loading-spinner"></span> Завантаження...';
    button.disabled = true;
    
    // Add spinner styles
    const spinner = button.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.cssText = `
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        `;
    }
    
    // Add spin animation
    if (!document.getElementById('spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoading(button) {
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    button.disabled = false;
    delete button.dataset.originalText;
}

// Show tooltip
function showTooltip(element, message) {
    hideTooltip(element); // Remove existing tooltip
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        margin-bottom: 5px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create arrow
    const arrow = document.createElement('div');
    arrow.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #333;
    `;
    tooltip.appendChild(arrow);
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 100);
}

function hideTooltip(element) {
    const tooltip = element.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Update cart counter
function updateCartCounter() {
    const counter = document.querySelector('.cart-counter');
    if (counter) {
        const currentCount = parseInt(counter.textContent) || 0;
        counter.textContent = currentCount + 1;
        
        // Animate counter
        counter.style.transform = 'scale(1.3)';
        setTimeout(() => {
            counter.style.transform = 'scale(1)';
        }, 200);
    }
}

// Analytics tracking
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, parameters);
}

// ===== INSTAGRAM INTEGRATION =====
function initInstagramFeed() {
    const instagramItems = document.querySelectorAll('.instagram-item');
    
    instagramItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            // Open Instagram profile or specific post
            const instagramUrl = 'https://instagram.com/armeniangrillhouse';
            window.open(instagramUrl, '_blank', 'noopener,noreferrer');
            
            trackEvent('instagram_click', {
                item_index: index
            });
        });
    });
}

// ===== KEYBOARD NAVIGATION =====
function initKeyboardNavigation() {
    // Escape key to close modals/menus
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            // Close any open modals here
        }
        
        // Enter key on focusable elements
        if (e.key === 'Enter' && e.target.matches('.tab-btn, .add-btn')) {
            e.target.click();
        }
    });
    
    // Tab navigation improvements
    const focusableElements = document.querySelectorAll(`
        a[href],
        button:not([disabled]),
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled]),
        [tabindex]:not([tabindex="-1"])
    `);
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '3px solid #ff6b35';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });
}

// ===== GEOLOCATION FOR DELIVERY =====
function initDeliveryZoneCheck() {
    const deliveryButtons = document.querySelectorAll('.cta-primary, .order-btn');
    
    deliveryButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        checkDeliveryZone(latitude, longitude);
                    },
                    error => {
                        console.log('Geolocation error:', error);
                        // Continue with order anyway
                    }
                );
            }
        });
    });
}

function checkDeliveryZone(lat, lng) {
    // Kyiv approximate boundaries
    const kyivBounds = {
        north: 50.590,
        south: 50.213,
        east: 30.825,
        west: 30.239
    };
    
    const isInKyiv = lat >= kyivBounds.south && 
                   lat <= kyivBounds.north && 
                   lng >= kyivBounds.west && 
                   lng <= kyivBounds.east;
    
    if (!isInKyiv) {
        showNotification('Доставка доступна тільки по Києву. Зв\'яжіться з нами для уточнення.', 'warning');
    }
    
    trackEvent('delivery_zone_check', {
        latitude: lat,
        longitude: lng,
        in_delivery_zone: isInKyiv
    });
}

// ===== ACCESSIBILITY IMPROVEMENTS =====
function initAccessibility() {
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Перейти до основного контенту';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10001;
        transition: top 0.3s ease;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // ARIA labels for interactive elements
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach((button, index) => {
        const dishTitle = button.closest('.dish-card').querySelector('.dish-title').textContent;
        button.setAttribute('aria-label', `Додати ${dishTitle} до кошика`);
    });
    
    // Announce dynamic content changes
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    
    // Use this to announce changes
    window.announceToScreenReader = function(message) {
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    };
}

// ===== INITIALIZE ADDITIONAL FEATURES =====
document.addEventListener('DOMContentLoaded', function() {
    initInstagramFeed();
    initKeyboardNavigation();
    initDeliveryZoneCheck();
    initAccessibility();
    
    // Add entrance animations
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno
    });
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        throttle,
        debounce,
        trackEvent
    };
}