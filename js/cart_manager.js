// ===== CART-MANAGER.JS - УПРАВЛІННЯ КОШИКОМ =====

// Core utilities and configuration
import { Utils, StorageUtils } from './utils.js';
import { CONFIG, MESSAGES, STORAGE_KEYS, ORDER_STATUSES, ANALYTICS_EVENTS } from './config.js';

// Menu data and services
import { MenuDataService } from './menu-data.js';

export class CartManager {
    constructor() {
        // State
        this.items = [];
        this.isOpen = false;
        this.isLoading = false;
        
        // DOM elements
        this.cartSidebar = Utils.$('.cart-sidebar');
        this.cartContent = Utils.$('.cart-content');
        this.cartOverlay = null;
        
        // Statistics
        this.stats = {
            addedItems: 0,
            removedItems: 0,
            clearedCount: 0,
            checkoutAttempts: 0
        };
        
        this.init();
    }
    
    init() {
        this.loadCartFromStorage();
        this.createCartElements();
        this.bindEvents();
        this.updateCartDisplay();
        this.createCartBadges();
        
        console.log('🛒 Cart Manager initialized with', this.items.length, 'items');
    }
    
    createCartElements() {
        // Create cart sidebar if it doesn't exist
        if (!this.cartSidebar) {
            this.cartSidebar = this.createCartSidebar();
            document.body.appendChild(this.cartSidebar);
        }
        
        // Create overlay
        this.cartOverlay = Utils.createElement('div', {
            className: 'cart-overlay',
            'aria-hidden': 'true'
        });
        document.body.appendChild(this.cartOverlay);
        
        // Find or create cart content
        this.cartContent = this.cartSidebar.querySelector('.cart-content');
        if (!this.cartContent) {
            this.cartContent = Utils.createElement('div', {
                className: 'cart-content'
            });
            this.cartSidebar.appendChild(this.cartContent);
        }
    }
    
    createCartSidebar() {
        return Utils.createElement('aside', {
            className: 'cart-sidebar',
            id: 'cart-sidebar',
            role: 'dialog',
            'aria-labelledby': 'cart-title',
            'aria-modal': 'true',
            innerHTML: `
                <div class="cart-header">
                    <h2 id="cart-title" class="cart-title">
                        <span class="cart-icon" aria-hidden="true">🛒</span>
                        Кошик
                    </h2>
                    <button class="cart-close" aria-label="Закрити кошик">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="cart-content"></div>
            `
        });
    }
    
    createCartBadges() {
        // Add cart badge to order buttons
        const orderBtns = Utils.$$('.order-btn, .cta-primary[href="#cart"]');
        orderBtns.forEach(btn => {
            if (!btn.querySelector('.cart-badge')) {
                const badge = Utils.createElement('span', {
                    className: 'cart-badge',
                    'aria-label': 'Кількість товарів у кошику'
                });
                btn.appendChild(badge);
            }
        });
    }
    
    bindEvents() {
        // Cart close button
        const closeBtn = this.cartSidebar?.querySelector('.cart-close');
        if (closeBtn) {
            Utils.on(closeBtn, 'click', () => this.closeCart());
        }
        
        // Overlay click
        Utils.on(this.cartOverlay, 'click', () => this.closeCart());
        
        // Order buttons
        const orderBtns = Utils.$$('.order-btn, .cta-primary');
        orderBtns.forEach(btn => {
            Utils.on(btn, 'click', (e) => this.handleOrderButtonClick(e, btn));
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeCart();
            }
        });
        
        // Storage events (for multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEYS.CART) {
                this.loadCartFromStorage();
                this.updateCartDisplay();
            }
        });
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncWithStorage();
            }
        });
        
        // Before unload warning
        window.addEventListener('beforeunload', (e) => {
            if (this.items.length > 0 && this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = MESSAGES.warnings.unsavedChanges;
                return e.returnValue;
            }
        });
    }
    
    handleOrderButtonClick(e, btn) {
        const href = btn.getAttribute('href');
        
        // Skip if it's a regular link
        if (href && href !== '#' && href !== '#cart' && !href.startsWith('#menu')) {
            return;
        }
        
        e.preventDefault();
        
        if (this.items.length > 0) {
            this.openCart();
        } else {
            // Scroll to menu if cart is empty
            const menuSection = Utils.$('#menu');
            if (menuSection) {
                Utils.scrollTo(menuSection);
                this.showToast(MESSAGES.info.selectSize, 'info');
            }
        }
        
        this.trackEvent(ANALYTICS_EVENTS.CART_BUTTON_CLICKED, {
            items_count: this.getItemCount(),
            cart_empty: this.items.length === 0
        });
    }
    
    // === CART OPERATIONS ===
    
    addItem(dish, selectedSize = null, quantity = 1, options = {}) {
        if (!dish || !dish.id) {
            console.error('Invalid dish object:', dish);
            return false;
        }
        
        if (quantity <= 0) {
            console.warn('Invalid quantity:', quantity);
            return false;
        }
        
        // Check max items limit
        if (this.getItemCount() + quantity > CONFIG.cart.maxItems) {
            this.showToast(`Максимум ${CONFIG.cart.maxItems} товарів у кошику`, 'warning');
            return false;
        }
        
        const item = this.createCartItem(dish, selectedSize, quantity, options);
        
        // Check if item already exists
        const existingItemIndex = this.items.findIndex(i => i.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Update existing item
            const existingItem = this.items[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > 10) { // Max quantity per item
                this.showToast('Максимум 10 одиниць одного товару', 'warning');
                return false;
            }
            
            existingItem.quantity = newQuantity;
            existingItem.updatedAt = new Date().toISOString();
        } else {
            // Add new item
            this.items.push(item);
        }
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showAddedFeedback(item);
        
        // Auto-open cart for first item or if requested
        if (this.items.length === 1 || options.openCart) {
            setTimeout(() => this.openCart(), 1000);
        }
        
        this.stats.addedItems++;
        this.trackEvent(ANALYTICS_EVENTS.ADD_TO_CART, {
            dish_id: dish.id,
            dish_name: dish.name,
            price: item.price,
            size: selectedSize?.name || null,
            quantity: quantity,
            cart_total: this.getSubtotal()
        });
        
        return true;
    }
    
    createCartItem(dish, selectedSize, quantity, options) {
        const price = selectedSize ? selectedSize.price : dish.price;
        const weight = selectedSize ? selectedSize.weight : dish.weight;
        
        return {
            id: `${dish.id}${selectedSize ? `-${selectedSize.name.toLowerCase()}` : ''}`,
            dishId: dish.id,
            name: dish.name,
            description: dish.description,
            price: price,
            quantity: quantity,
            size: selectedSize ? selectedSize.name : null,
            weight: weight,
            image: dish.image,
            category: dish.category,
            allergens: dish.allergens || [],
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...options
        };
    }
    
    removeItem(itemId) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            console.warn('Item not found:', itemId);
            return false;
        }
        
        const removedItem = this.items[itemIndex];
        this.items.splice(itemIndex, 1);
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showToast(`${removedItem.name} видалено з кошика`, 'info');
        
        this.stats.removedItems++;
        this.trackEvent(ANALYTICS_EVENTS.REMOVE_FROM_CART, {
            dish_id: removedItem.dishId,
            dish_name: removedItem.name,
            price: removedItem.price,
            quantity: removedItem.quantity
        });
        
        return true;
    }
    
    updateQuantity(itemId, newQuantity) {
        if (newQuantity <= 0) {
            return this.removeItem(itemId);
        }
        
        if (newQuantity > 10) {
            this.showToast('Максимум 10 одиниць одного товару', 'warning');
            return false;
        }
        
        const item = this.items.find(item => item.id === itemId);
        
        if (!item) {
            console.warn('Item not found:', itemId);
            return false;
        }
        
        const oldQuantity = item.quantity;
        item.quantity = newQuantity;
        item.updatedAt = new Date().toISOString();
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        
        this.trackEvent(ANALYTICS_EVENTS.CART_QUANTITY_CHANGED, {
            dish_id: item.dishId,
            old_quantity: oldQuantity,
            new_quantity: newQuantity,
            price_difference: (newQuantity - oldQuantity) * item.price
        });
        
        return true;
    }
    
    clearCart() {
        if (this.items.length === 0) return;
        
        // Show confirmation
        if (!confirm(MESSAGES.warnings.confirmClear)) {
            return;
        }
        
        const itemCount = this.getItemCount();
        this.items = [];
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showToast(MESSAGES.success.cartCleared, 'info');
        
        this.stats.clearedCount++;
        this.trackEvent(ANALYTICS_EVENTS.CART_CLEARED, {
            items_count: itemCount
        });
    }
    
    // === CART UI ===
    
    openCart() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        
        // Update DOM
        this.cartSidebar.classList.add('open');
        this.cartOverlay.classList.add('active');
        this.cartOverlay.setAttribute('aria-hidden', 'false');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.classList.add('cart-open');
        
        // Focus management
        this.setCartFocus();
        
        // Analytics
        this.trackEvent(ANALYTICS_EVENTS.CART_OPENED, {
            items_count: this.getItemCount(),
            cart_value: this.getSubtotal()
        });
        
        console.log('🛒 Cart opened with', this.items.length, 'items');
    }
    
    closeCart() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Update DOM
        this.cartSidebar.classList.remove('open');
        this.cartOverlay.classList.remove('active');
        this.cartOverlay.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.classList.remove('cart-open');
        
        console.log('🛒 Cart closed');
    }
    
    setCartFocus() {
        // Focus on close button or first focusable element
        const focusableElements = this.cartSidebar.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            setTimeout(() => {
                focusableElements[0].focus();
            }, 150);
        }
    }
    
    updateCartDisplay() {
        this.updateCartBadges();
        this.renderCartContent();
        this.updateCartTitle();
    }
    
    updateCartBadges() {
        const itemCount = this.getItemCount();
        const badges = Utils.$$('.cart-badge');
        
        badges.forEach(badge => {
            badge.textContent = itemCount;
            badge.style.display = itemCount > 0 ? 'flex' : 'none';
            badge.setAttribute('aria-label', `${itemCount} товарів у кошику`);
        });
    }
    
    updateCartTitle() {
        const titleElement = this.cartSidebar?.querySelector('#cart-title');
        if (titleElement) {
            const itemCount = this.getItemCount();
            const titleText = titleElement.querySelector('.cart-icon').nextSibling;
            titleText.textContent = ` Кошик (${itemCount})`;
        }
    }
    
    renderCartContent() {
        if (!this.cartContent) return;
        
        if (this.items.length === 0) {
            this.renderEmptyCart();
            return;
        }
        
        const subtotal = this.getSubtotal();
        const deliveryFee = this.getDeliveryFee();
        const total = subtotal + deliveryFee;
        const isValidOrder = this.isValidOrder();
        
        this.cartContent.innerHTML = `
            <div class="cart-items">
                ${this.items.map(item => this.renderCartItem(item)).join('')}
            </div>
            
            <div class="cart-summary">
                <div class="summary-section">
                    <div class="summary-row">
                        <span>Сума замовлення:</span>
                        <span class="amount">${Utils.formatPrice(subtotal)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Доставка:</span>
                        <span class="amount ${deliveryFee === 0 ? 'free' : ''}">${
                            deliveryFee === 0 ? 'Безкоштовно' : Utils.formatPrice(deliveryFee)
                        }</span>
                    </div>
                    ${this.renderFreeDeliveryProgress(subtotal)}
                    <div class="summary-row total">
                        <span>До сплати:</span>
                        <span class="amount">${Utils.formatPrice(total)}</span>
                    </div>
                </div>
                
                <div class="cart-actions">
                    <button class="btn btn-secondary clear-cart-btn" ${this.items.length === 0 ? 'disabled' : ''}>
                        <span class="btn-icon" aria-hidden="true">🗑️</span>
                        Очистити кошик
                    </button>
                    <button class="btn cta-primary checkout-btn" ${!isValidOrder ? 'disabled' : ''}>
                        <span class="btn-text">Оформити замовлення</span>
                        <span class="btn-loader" aria-hidden="true"></span>
                    </button>
                </div>
                
                ${this.renderOrderValidation(subtotal)}
                ${this.renderEstimatedTime()}
            </div>
        `;
        
        this.bindCartItemEvents();
    }
    
    renderEmptyCart() {
        this.cartContent.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon" aria-hidden="true">🛒</div>
                <h3>Ваш кошик порожній</h3>
                <p class="empty-description">Додайте смачні страви з нашого меню</p>
                <button class="btn cta-primary browse-menu-btn">
                    <span class="btn-icon" aria-hidden="true">🍽️</span>
                    Перейти до меню
                </button>
            </div>
        `;
        
        // Bind browse menu button
        const browseBtn = this.cartContent.querySelector('.browse-menu-btn');
        Utils.on(browseBtn, 'click', () => {
            this.closeCart();
            Utils.scrollTo('#menu');
        });
    }
    
    renderCartItem(item) {
        const itemTotal = item.price * item.quantity;
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" width="60" height="60" loading="lazy">
                    ${item.allergens && item.allergens.length > 0 ? 
                        `<div class="allergen-indicator" title="Містить алергени: ${item.allergens.join(', ')}">⚠️</div>` : ''
                    }
                </div>
                
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    ${item.size ? `<p class="item-size">${item.size}</p>` : ''}
                    ${item.weight ? `<p class="item-weight">${item.weight}</p>` : ''}
                    <div class="item-price-info">
                        <span class="unit-price">${Utils.formatPrice(item.price)} за шт.</span>
                        ${item.quantity > 1 ? `<span class="total-price">${Utils.formatPrice(itemTotal)} всього</span>` : ''}
                    </div>
                </div>
                
                <div class="item-controls">
                    <button class="quantity-btn minus" 
                            onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})"
                            aria-label="Зменшити кількість ${item.name}"
                            ${item.quantity <= 1 ? 'disabled' : ''}>
                        <span aria-hidden="true">−</span>
                    </button>
                    <div class="quantity-display">
                        <span class="quantity" aria-label="Кількість: ${item.quantity}">${item.quantity}</span>
                        <span class="quantity-unit">шт.</span>
                    </div>
                    <button class="quantity-btn plus" 
                            onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})"
                            aria-label="Збільшити кількість ${item.name}"
                            ${item.quantity >= 10 ? 'disabled' : ''}>
                        <span aria-hidden="true">+</span>
                    </button>
                </div>
                
                <div class="item-total">
                    <span class="total-amount">${Utils.formatPrice(itemTotal)}</span>
                </div>
                
                <button class="remove-btn" 
                        onclick="cartManager.removeItem('${item.id}')"
                        aria-label="Видалити ${item.name} з кошика">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
        `;
    }
    
    renderFreeDeliveryProgress(subtotal) {
        const threshold = CONFIG.cart.freeDeliveryThreshold;
        const remaining = threshold - subtotal;
        
        if (remaining <= 0) {
            return `
                <div class="free-delivery-achieved">
                    <span class="achievement-icon" aria-hidden="true">🎉</span>
                    Вітаємо! Ви отримали безкоштовну доставку
                </div>
            `;
        }
        
        const progress = Math.min((subtotal / threshold) * 100, 100);
        
        return `
            <div class="free-delivery-progress">
                <div class="progress-text">
                    Додайте ще ${Utils.formatPrice(remaining)} для безкоштовної доставки
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }
    
    renderOrderValidation(subtotal) {
        if (subtotal >= CONFIG.cart.minOrderAmount) {
            return '';
        }
        
        const remaining = CONFIG.cart.minOrderAmount - subtotal;
        
        return `
            <div class="order-validation warning">
                <span class="validation-icon" aria-hidden="true">⚠️</span>
                <div class="validation-text">
                    <strong>Мінімальна сума замовлення: ${Utils.formatPrice(CONFIG.cart.minOrderAmount)}</strong>
                    <p>Додайте ще ${Utils.formatPrice(remaining)} для оформлення замовлення</p>
                </div>
            </div>
        `;
    }
    
    renderEstimatedTime() {
        const totalTime = this.calculateEstimatedTime();
        
        return `
            <div class="estimated-time">
                <span class="time-icon" aria-hidden="true">⏱️</span>
                <div class="time-info">
                    <span class="time-label">Орієнтовний час:</span>
                    <span class="time-value">${totalTime} хв</span>
                </div>
            </div>
        `;
    }
    
    bindCartItemEvents() {
        // Clear cart button
        const clearBtn = this.cartContent.querySelector('.clear-cart-btn');
        if (clearBtn) {
            Utils.on(clearBtn, 'click', () => this.clearCart());
        }
        
        // Checkout button
        const checkoutBtn = this.cartContent.querySelector('.checkout-btn');
        if (checkoutBtn) {
            Utils.on(checkoutBtn, 'click', () => this.proceedToCheckout());
        }
        
        // Add hover effects and animations
        const cartItems = this.cartContent.querySelectorAll('.cart-item');
        cartItems.forEach(item => {
            Utils.on(item, 'mouseenter', () => {
                item.classList.add('hovered');
            });
            
            Utils.on(item, 'mouseleave', () => {
                item.classList.remove('hovered');
            });
        });
    }
    
    // === CALCULATIONS ===
    
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    getDeliveryFee() {
        const subtotal = this.getSubtotal();
        return subtotal >= CONFIG.cart.freeDeliveryThreshold ? 0 : CONFIG.cart.deliveryFee;
    }
    
    getTotal() {
        return this.getSubtotal() + this.getDeliveryFee();
    }
    
    getTotalItems() {
        return this.items.length;
    }
    
    getTotalWeight() {
        return this.items.reduce((sum, item) => {
            const weight = parseFloat(item.weight?.replace(/[^\d.]/g, '') || 0);
            return sum + (weight * item.quantity);
        }, 0);
    }
    
    calculateEstimatedTime() {
        let maxTime = 0;
        
        this.items.forEach(item => {
            const dish = MenuDataService.getDishById(item.dishId);
            if (dish && dish.preparationTime) {
                maxTime = Math.max(maxTime, dish.preparationTime);
            }
        });
        
        // Add base delivery time
        const deliveryTime = CONFIG.delivery.estimatedTime.min;
        return maxTime + deliveryTime;
    }
    
    isValidOrder() {
        const subtotal = this.getSubtotal();
        const isOpenNow = Utils.isRestaurantOpen();
        const hasItems = this.items.length > 0;
        const meetsMinimum = subtotal >= CONFIG.cart.minOrderAmount;
        
        return hasItems && meetsMinimum && isOpenNow;
    }
    
    // === CHECKOUT ===
    
    proceedToCheckout() {
        if (!this.isValidOrder()) {
            this.showValidationErrors();
            return;
        }
        
        this.stats.checkoutAttempts++;
        this.trackEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
            items_count: this.getItemCount(),
            total_amount: this.getTotal(),
            delivery_fee: this.getDeliveryFee()
        });
        
        this.openCheckoutModal();
    }
    
    showValidationErrors() {
        const subtotal = this.getSubtotal();
        
        if (this.items.length === 0) {
            this.showToast(MESSAGES.errors.cartEmpty, 'warning');
            return;
        }
        
        if (subtotal < CONFIG.cart.minOrderAmount) {
            this.showToast(`${MESSAGES.errors.minOrder} ${Utils.formatPrice(CONFIG.cart.minOrderAmount)}`, 'warning');
            return;
        }
        
        if (!Utils.isRestaurantOpen()) {
            this.showToast(MESSAGES.errors.restaurantClosed, 'warning');
            return;
        }
    }
    
    openCheckoutModal() {
        // Implementation will be in separate checkout manager
        if (window.checkoutManager) {
            window.checkoutManager.open(this.getCartData());
        } else {
            // Fallback - simple checkout modal
            this.createSimpleCheckoutModal();
        }
    }
    
    createSimpleCheckoutModal() {
        const modal = Utils.createElement('div', {
            className: 'checkout-modal modal-overlay',
            innerHTML: `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Оформлення замовлення</h2>
                        <button class="modal-close" aria-label="Закрити">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="checkout-summary">
                            <h3>Ваше замовлення:</h3>
                            ${this.renderCheckoutSummary()}
                        </div>
                        <div class="checkout-contact">
                            <h3>Зв'яжіться з нами для оформлення:</h3>
                            <div class="contact-options">
                                <a href="tel:${CONFIG.business.phone}" class="contact-btn phone">
                                    <span class="icon">📞</span>
                                    ${Utils.formatPhone(CONFIG.business.phone)}
                                </a>
                                <a href="tel:${CONFIG.business.phone2}" class="contact-btn phone">
                                    <span class="icon">📱</span>
                                    ${Utils.formatPhone(CONFIG.business.phone2)}
                                </a>
                            </div>
                            <p class="checkout-note">
                                Ми приймемо ваше замовлення та уточнимо деталі доставки
                            </p>
                        </div>
                    </div>
                </div>
            `