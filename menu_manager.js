// ===== MENU-MANAGER.JS - УПРАВЛІННЯ МЕНЮ UI =====

import { Utils } from './utils.js';
import { CONFIG, MENU_CATEGORIES, ANALYTICS_EVENTS } from './config.js';
import { MenuDataService, MENU_DATA, MENU_CATEGORIES_INFO, MENU_FILTERS } from './menu-data.js';

export class MenuManager {
    constructor() {
        // DOM elements
        this.menuContainer = Utils.$('.dishes-grid')?.parentElement;
        this.menuTabs = Utils.$$('.tab-btn');
        this.menuPanels = Utils.$$('.menu-panel');
        this.searchInput = Utils.$('.menu-search');
        this.filterButtons = Utils.$$('.filter-btn');
        this.sortSelect = Utils.$('.menu-sort');
        
        // State
        this.activeCategory = MENU_CATEGORIES.SHAWARMA;
        this.activeFilters = new Set();
        this.currentSort = 'popular';
        this.searchQuery = '';
        this.viewMode = 'grid'; // grid | list
        this.isLoading = false;
        
        // Cache
        this.renderedItems = new Map();
        this.filterCache = new Map();
        
        // Intersection Observer for lazy loading
        this.observer = null;
        
        this.init();
    }
    
    init() {
        this.createMenuStructure();
        this.bindEvents();
        this.loadMenuData();
        this.setupIntersectionObserver();
        this.showInitialCategory();
        
        console.log('🍽️ Menu Manager initialized');
    }
    
    createMenuStructure() {
        if (!this.menuContainer) {
            console.warn('Menu container not found');
            return;
        }
        
        // Create menu controls if they don't exist
        this.createMenuControls();
        
        // Create category tabs
        this.createCategoryTabs();
        
        // Create menu panels for each category
        this.createMenuPanels();
    }
    
    createMenuControls() {
        let controlsContainer = Utils.$('.menu-controls');
        
        if (!controlsContainer) {
            controlsContainer = Utils.createElement('div', {
                className: 'menu-controls',
                innerHTML: `
                    <div class="menu-search-container">
                        <input type="search" 
                               class="menu-search" 
                               placeholder="Пошук страв..." 
                               aria-label="Пошук в меню">
                        <button class="search-clear" aria-label="Очистити пошук">&times;</button>
                    </div>
                    
                    <div class="menu-filters">
                        <button class="filter-btn" data-filter="popular" aria-pressed="false">
                            <span class="filter-icon">🔥</span>
                            Популярні
                        </button>
                        <button class="filter-btn" data-filter="vegetarian" aria-pressed="false">
                            <span class="filter-icon">🌱</span>
                            Вегетаріанські
                        </button>
                        <button class="filter-btn" data-filter="spicy" aria-pressed="false">
                            <span class="filter-icon">🌶️</span>
                            Гострі
                        </button>
                        <button class="filter-btn" data-filter="new" aria-pressed="false">
                            <span class="filter-icon">✨</span>
                            Новинки
                        </button>
                    </div>
                    
                    <div class="menu-view-options">
                        <select class="menu-sort" aria-label="Сортування">
                            <option value="popular">За популярністю</option>
                            <option value="price-asc">За ціною ↑</option>
                            <option value="price-desc">За ціною ↓</option>
                            <option value="name">За назвою</option>
                            <option value="rating">За рейтингом</option>
                        </select>
                        
                        <div class="view-toggle" role="radiogroup" aria-label="Режим перегляду">
                            <button class="view-btn active" data-view="grid" aria-pressed="true">
                                <span aria-hidden="true">⊞</span>
                            </button>
                            <button class="view-btn" data-view="list" aria-pressed="false">
                                <span aria-hidden="true">☰</span>
                            </button>
                        </div>
                    </div>
                `
            });
            
            // Insert before menu tabs
            const menuTabs = Utils.$('.menu-tabs');
            if (menuTabs) {
                menuTabs.parentNode.insertBefore(controlsContainer, menuTabs);
            } else {
                this.menuContainer.insertBefore(controlsContainer, this.menuContainer.firstChild);
            }
        }
        
        // Update references
        this.searchInput = Utils.$('.menu-search');
        this.filterButtons = Utils.$$('.filter-btn');
        this.sortSelect = Utils.$('.menu-sort');
    }
    
    createCategoryTabs() {
        let tabsContainer = Utils.$('.menu-tabs');
        
        if (!tabsContainer) {
            tabsContainer = Utils.createElement('div', {
                className: 'menu-tabs',
                role: 'tablist',
                'aria-label': 'Категорії меню'
            });
            
            // Add tabs for each category
            Object.entries(MENU_CATEGORIES_INFO).forEach(([categoryId, info]) => {
                if (MENU_DATA[categoryId] && MENU_DATA[categoryId].length > 0) {
                    const tab = Utils.createElement('button', {
                        className: `tab-btn ${categoryId === this.activeCategory ? 'active' : ''}`,
                        role: 'tab',
                        'aria-selected': categoryId === this.activeCategory ? 'true' : 'false',
                        'aria-controls': `${categoryId}-panel`,
                        'data-category': categoryId,
                        innerHTML: `
                            <span class="tab-icon" aria-hidden="true">${info.icon}</span>
                            <span class="tab-text">${info.name}</span>
                            <span class="tab-count">${MENU_DATA[categoryId].length}</span>
                        `
                    });
                    
                    tabsContainer.appendChild(tab);
                }
            });
            
            this.menuContainer.appendChild(tabsContainer);
        }
        
        // Update references
        this.menuTabs = Utils.$$('.tab-btn');
    }
    
    createMenuPanels() {
        // Remove existing panels
        const existingPanels = Utils.$$('.menu-panel');
        existingPanels.forEach(panel => panel.remove());
        
        // Create panels for each category
        Object.keys(MENU_DATA).forEach(categoryId => {
            if (MENU_DATA[categoryId].length > 0) {
                this.createMenuPanel(categoryId);
            }
        });
        
        // Update references
        this.menuPanels = Utils.$$('.menu-panel');
    }
    
    createMenuPanel(categoryId) {
        const panel = Utils.createElement('div', {
            className: `menu-panel ${categoryId === this.activeCategory ? 'active' : ''}`,
            id: `${categoryId}-panel`,
            role: 'tabpanel',
            'aria-labelledby': `${categoryId}-tab`,
            'aria-hidden': categoryId !== this.activeCategory ? 'true' : 'false'
        });
        
        const dishesGrid = Utils.createElement('div', {
            className: `dishes-grid view-${this.viewMode}`,
            'data-category': categoryId
        });
        
        panel.appendChild(dishesGrid);
        this.menuContainer.appendChild(panel);
        
        return panel;
    }
    
    bindEvents() {
        // Category tabs
        this.menuTabs.forEach(tab => {
            Utils.on(tab, 'click', (e) => this.handleTabClick(e));
            Utils.on(tab, 'keydown', (e) => this.handleTabKeydown(e));
        });
        
        // Search
        if (this.searchInput) {
            Utils.on(this.searchInput, 'input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
            
            Utils.on(this.searchInput, 'keydown', (e) => {
                if (e.key === 'Escape') {
                    e.target.value = '';
                    this.handleSearch('');
                }
            });
        }
        
        // Search clear button
        const searchClear = Utils.$('.search-clear');
        if (searchClear) {
            Utils.on(searchClear, 'click', () => {
                this.searchInput.value = '';
                this.handleSearch('');
                this.searchInput.focus();
            });
        }
        
        // Filters
        this.filterButtons.forEach(btn => {
            Utils.on(btn, 'click', (e) => this.handleFilterClick(e));
        });
        
        // Sort
        if (this.sortSelect) {
            Utils.on(this.sortSelect, 'change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }
        
        // View toggle
        const viewButtons = Utils.$$('.view-btn');
        viewButtons.forEach(btn => {
            Utils.on(btn, 'click', (e) => this.handleViewToggle(e));
        });
        
        // Dish cards will be bound dynamically
        Utils.on(document, 'click', (e) => {
            if (e.target.matches('.add-btn') || e.target.closest('.add-btn')) {
                this.handleAddToCart(e);
            }
            
            if (e.target.matches('.size-option') || e.target.closest('.size-option')) {
                this.handleSizeSelection(e);
            }
            
            if (e.target.matches('.dish-card') || e.target.closest('.dish-card')) {
                this.handleDishClick(e);
            }
        });
        
        // Keyboard navigation
        Utils.on(document, 'keydown', (e) => {
            if (e.target.closest('.menu-panel')) {
                this.handleMenuKeydown(e);
            }
        });
        
        // Window resize for responsive adjustments
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
    }
    
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '50px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const dishCard = entry.target;
                    this.loadDishCard(dishCard);
                    this.observer.unobserve(dishCard);
                }
            });
        }, options);
    }
    
    loadDishCard(dishCard) {
        const dishId = dishCard.dataset.dishId;
        if (dishId && !dishCard.classList.contains('loaded')) {
            // Simulate loading delay for better UX
            setTimeout(() => {
                dishCard.classList.add('loaded');
                this.animateDishCard(dishCard);
            }, 100);
        }
    }
    
    animateDishCard(dishCard) {
        dishCard.style.opacity = '0';
        dishCard.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            dishCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            dishCard.style.opacity = '1';
            dishCard.style.transform = 'translateY(0)';
        });
    }
    
    // === EVENT HANDLERS ===
    
    handleTabClick(e) {
        const tab = e.target.closest('.tab-btn');
        if (!tab) return;
        
        const category = tab.dataset.category;
        this.switchToCategory(category, tab);
        
        this.trackEvent(ANALYTICS_EVENTS.MENU_CATEGORY_CLICK, {
            category: category,
            previous_category: this.activeCategory
        });
    }
    
    handleTabKeydown(e) {
        const tabs = Array.from(this.menuTabs);
        const currentIndex = tabs.indexOf(e.target);
        
        let newIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        tabs[newIndex].focus();
        tabs[newIndex].click();
    }
    
    handleSearch(query) {
        this.searchQuery = query.trim().toLowerCase();
        this.updateMenuDisplay();
        
        // Show search indicator
        this.toggleSearchIndicator(this.searchQuery.length > 0);
        
        this.trackEvent(ANALYTICS_EVENTS.MENU_SEARCH, {
            query: this.searchQuery,
            category: this.activeCategory,
            results_count: this.getFilteredDishes().length
        });
    }
    
    handleFilterClick(e) {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        
        const filter = btn.dataset.filter;
        const isActive = this.activeFilters.has(filter);
        
        if (isActive) {
            this.activeFilters.delete(filter);
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        } else {
            this.activeFilters.add(filter);
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            
            this.viewMode = newView;
            this.updateViewMode();
            
            this.trackEvent(ANALYTICS_EVENTS.MENU_VIEW_CHANGED, {
                view_mode: newView
            });
        }
    }
    
    handleAddToCart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target.closest('.add-btn');
        const dishCard = btn.closest('.dish-card');
        const dishId = dishCard.dataset.dishId;
        
        if (!dishId) return;
        
        const dish = MenuDataService.getDishById(dishId);
        if (!dish) return;
        
        // Check if size selection is required
        const selectedSize = this.getSelectedSize(dishCard);
        
        if (dish.sizes && dish.sizes.length > 0 && !selectedSize) {
            this.showSizeSelectionPrompt(dishCard);
            return;
        }
        
        // Add to cart
        if (window.cartManager) {
            const success = window.cartManager.addItem(dish, selectedSize);
            if (success) {
                this.showAddedFeedback(btn, dish, selectedSize);
            }
        }
        
        this.trackEvent(ANALYTICS_EVENTS.ADD_TO_CART, {
            dish_id: dishId,
            dish_name: dish.name,
            category: dish.category,
            price: selectedSize ? selectedSize.price : dish.price,
            size: selectedSize ? selectedSize.name : null
        });
    }
    
    handleSizeSelection(e) {
        const sizeOption = e.target.closest('.size-option');
        const dishCard = sizeOption.closest('.dish-card');
        
        // Remove previous selection
        const allSizeOptions = dishCard.querySelectorAll('.size-option');
        allSizeOptions.forEach(option => option.classList.remove('selected'));
        
        // Select current option
        sizeOption.classList.add('selected');
        
        // Update add button state
        const addBtn = dishCard.querySelector('.add-btn');
        addBtn.classList.add('size-selected');
        
        // Update price display
        const price = sizeOption.dataset.price;
        const priceDisplay = dishCard.querySelector('.selected-price');
        if (priceDisplay) {
            priceDisplay.textContent = Utils.formatPrice(price);
        }
        
        this.trackEvent(ANALYTICS_EVENTS.DISH_SIZE_SELECTED, {
            dish_id: dishCard.dataset.dishId,
            size: sizeOption.dataset.size,
            price: price
        });
    }
    
    handleDishClick(e) {
        // Don't trigger if clicking on interactive elements
        if (e.target.matches('button, .size-option, .add-btn') || 
            e.target.closest('button, .size-option, .add-btn')) {
            return;
        }
        
        const dishCard = e.target.closest('.dish-card');
        const dishId = dishCard?.dataset.dishId;
        
        if (dishId) {
            this.openDishModal(dishId);
        }
    }
    
    handleMenuKeydown(e) {
        const dishCards = Array.from(Utils.$('.dish-card'));
        const currentCard = e.target.closest('.dish-card');
        
        if (!currentCard) return;
        
        const currentIndex = dishCards.indexOf(currentCard);
        let newIndex;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = currentIndex < dishCards.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowLeft':
                newIndex = currentIndex > 0 ? currentIndex - 1 : dishCards.length - 1;
                break;
            case 'ArrowDown':
            case 'ArrowUp':
                // Calculate grid navigation
                const itemsPerRow = this.getItemsPerRow();
                if (e.key === 'ArrowDown') {
                    newIndex = currentIndex + itemsPerRow;
                    if (newIndex >= dishCards.length) newIndex = currentIndex;
                } else {
                    newIndex = currentIndex - itemsPerRow;
                    if (newIndex < 0) newIndex = currentIndex;
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.openDishModal(currentCard.dataset.dishId);
                return;
            default:
                return;
        }
        
        e.preventDefault();
        if (dishCards[newIndex]) {
            dishCards[newIndex].focus();
        }
    }
    
    handleResize() {
        // Update view mode for responsive design
        if (Utils.isMobile() && this.viewMode === 'grid') {
            this.updateViewMode();
        }
        
        // Recalculate lazy loading
        this.refreshIntersectionObserver();
    }
    
    // === CORE FUNCTIONALITY ===
    
    switchToCategory(category, activeTab = null) {
        if (category === this.activeCategory) return;
        
        this.activeCategory = category;
        
        // Update tab states
        this.menuTabs.forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        
        // Show corresponding panel
        this.showMenuCategory(category);
        
        // Clear search when switching categories
        if (this.searchQuery) {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.toggleSearchIndicator(false);
        }
        
        // Update URL hash
        if (history.pushState) {
            history.pushState(null, null, `#menu-${category}`);
        }
    }
    
    showMenuCategory(category) {
        // Hide all panels
        this.menuPanels.forEach(panel => {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        });
        
        // Show target panel
        const targetPanel = Utils.$(`#${category}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.setAttribute('aria-hidden', 'false');
            
            // Load dishes if not already loaded
            this.loadDishesForCategory(category);
            
            // Trigger animations
            this.animatePanelChange(targetPanel);
        }
    }
    
    loadDishesForCategory(category) {
        const panel = Utils.$(`#${category}-panel`);
        const dishesGrid = panel?.querySelector('.dishes-grid');
        
        if (!dishesGrid || dishesGrid.dataset.loaded === 'true') {
            return;
        }
        
        const dishes = this.getFilteredDishes(category);
        this.renderDishes(dishes, dishesGrid);
        
        dishesGrid.dataset.loaded = 'true';
    }
    
    updateMenuDisplay() {
        const dishes = this.getFilteredDishes();
        const currentPanel = Utils.$(`#${this.activeCategory}-panel`);
        const dishesGrid = currentPanel?.querySelector('.dishes-grid');
        
        if (dishesGrid) {
            this.renderDishes(dishes, dishesGrid);
        }
        
        // Update results count
        this.updateResultsCount(dishes.length);
    }
    
    getFilteredDishes(category = this.activeCategory) {
        const cacheKey = `${category}-${this.searchQuery}-${Array.from(this.activeFilters).join(',')}-${this.currentSort}`;
        
        if (this.filterCache.has(cacheKey)) {
            return this.filterCache.get(cacheKey);
        }
        
        let dishes = MenuDataService.getDishesByCategory(category);
        
        // Apply search filter
        if (this.searchQuery) {
            dishes = dishes.filter(dish => 
                dish.name.toLowerCase().includes(this.searchQuery) ||
                dish.description.toLowerCase().includes(this.searchQuery) ||
                (dish.allergens && dish.allergens.some(allergen => 
                    allergen.toLowerCase().includes(this.searchQuery)
                ))
            );
        }
        
        // Apply active filters
        this.activeFilters.forEach(filter => {
            dishes = this.applyFilter(dishes, filter);
        });
        
        // Apply sorting
        dishes = this.sortDishes(dishes, this.currentSort);
        
        // Cache result
        this.filterCache.set(cacheKey, dishes);
        
        return dishes;
    }
    
    applyFilter(dishes, filter) {
        switch (filter) {
            case 'popular':
                return dishes.filter(dish => dish.popular);
            
            case 'vegetarian':
                return dishes.filter(dish => dish.vegetarian);
            
            case 'vegan':
                return dishes.filter(dish => dish.vegan);
            
            case 'spicy':
                return dishes.filter(dish => dish.spiceLevel >= 2);
            
            case 'new':
                return dishes.filter(dish => dish.isNew);
            
            case 'premium':
                return dishes.filter(dish => dish.premium);
            
            case 'quick':
                return dishes.filter(dish => dish.preparationTime <= 10);
            
            default:
                return dishes;
        }
    }
    
    sortDishes(dishes, sortMethod) {
        const sorted = [...dishes];
        
        switch (sortMethod) {
            case 'popular':
                return sorted.sort((a, b) => {
                    const scoreA = (a.popular ? 10 : 0) + (a.rating || 0);
                    const scoreB = (b.popular ? 10 : 0) + (b.rating || 0);
                    return scoreB - scoreA;
                });
            
            case 'price-asc':
                return sorted.sort((a, b) => {
                    const priceA = a.price || (a.sizes ? a.sizes[0].price : 0);
                    const priceB = b.price || (b.sizes ? b.sizes[0].price : 0);
                    return priceA - priceB;
                });
            
            case 'price-desc':
                return sorted.sort((a, b) => {
                    const priceA = a.price || (a.sizes ? a.sizes[0].price : 0);
                    const priceB = b.price || (b.sizes ? b.sizes[0].price : 0);
                    return priceB - priceA;
                });
            
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
            
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            
            default:
                return sorted;
        }
    }
    
    renderDishes(dishes, container) {
        if (!container) return;
        
        this.isLoading = true;
        this.showLoadingState(container);
        
        // Clear existing content
        container.innerHTML = '';
        
        if (dishes.length === 0) {
            this.showEmptyState(container);
            this.isLoading = false;
            return;
        }
        
        // Render dishes
        const fragment = document.createDocumentFragment();
        
        dishes.forEach((dish, index) => {
            const dishCard = this.createDishCard(dish, index);
            fragment.appendChild(dishCard);
            
            // Setup intersection observer for lazy loading
            if (this.observer) {
                this.observer.observe(dishCard);
            }
        });
        
        container.appendChild(fragment);
        
        // Update view mode
        container.className = `dishes-grid view-${this.viewMode}`;
        
        this.isLoading = false;
        
        // Animate entrance
        requestAnimationFrame(() => {
            container.classList.add('loaded');
        });
    }
    
    createDishCard(dish, index = 0) {
        const price = dish.price || (dish.sizes ? dish.sizes[0].price : 0);
        const rating = dish.rating || 4.5;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        const card = Utils.createElement('article', {
            className: 'dish-card animate-on-scroll',
            'data-dish-id': dish.id,
            'data-category': dish.category,
            tabindex: '0',
            role: 'button',
            'aria-label': `${dish.name}, ${Utils.formatPrice(price)}`,
            style: `animation-delay: ${index * 0.1}s`
        });
        
        card.innerHTML = `
            <div class="dish-image">
                <img src="${dish.image}" 
                     alt="${dish.name}" 
                     width="300" 
                     height="200" 
                     loading="lazy">
                ${this.createDishBadges(dish)}
                ${dish.preparationTime ? `
                    <div class="prep-time">
                        <span class="time-icon" aria-hidden="true">⏱️</span>
                        ${dish.preparationTime} хв
                    </div>
                ` : ''}
            </div>
            
            <div class="dish-content">
                ${this.createRatingDisplay(rating, dish.reviewsCount)}
                
                <h3 class="dish-title">${dish.name}</h3>
                <p class="dish-description">${dish.description}</p>
                
                ${this.createDishDetails(dish)}
                ${this.createPriceDisplay(dish)}
                
                <button class="add-btn" 
                        aria-label="Додати ${dish.name} до кошика"
                        ${dish.sizes && dish.sizes.length > 0 ? 'data-requires-size="true"' : ''}>
                    <span class="btn-text">Додати</span>
                    <span class="btn-icon" aria-hidden="true">+</span>
                    <span class="btn-loader" aria-hidden="true"></span>
                </button>
            </div>
        `;
        
        return card;
    }
    
    createDishBadges(dish) {
        const badges = [];
        
        if (dish.popular) badges.push('<div class="dish-badge popular">Хіт продажів</div>');
        if (dish.premium) badges.push('<div class="dish-badge premium">Преміум</div>');
        if (dish.isNew) badges.push('<div class="dish-badge new">Новинка</div>');
        if (dish.vegetarian) badges.push('<div class="dish-badge vegetarian">🌱</div>');
        if (dish.vegan) badges.push('<div class="dish-badge vegan">🌿</div>');
        if (dish.spiceLevel >= 2) badges.push('<div class="dish-badge spicy">🌶️</div>');
        
        return badges.join('');
    }
    
    createRatingDisplay(rating, reviewsCount = 0) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return `
            <div class="dish-rating" aria-label="Рейтинг ${rating} з 5 зірок">
                <div class="stars">
                    ${'★'.repeat(fullStars)}
                    ${hasHalfStar ? '☆' : ''}
                    ${'☆'.repeat(emptyStars)}
                </div>
                <span class="rating-text">(${rating})</span>
                ${reviewsCount > 0 ? `<span class="reviews-count">${reviewsCount} відгуків</span>` : ''}
            </div>
        `;
    }
    
    createDishDetails(dish) {
        const details = [];
        
        if (dish.calories) details.push(`${dish.calories} ккал`);
        if (dish.weight) details.push(dish.weight);
        if (dish.allergens && dish.allergens.length > 0) {
            details.push(`⚠️ ${dish.allergens.join(', ')}`);
        }
        
        return details.length > 0 ? `
            <div class="dish-details">
                ${details.map(detail => `<span class="detail-item">${detail}</span>`).join('')}
            </div>
        ` : '';
    }
    
    createPriceDisplay(dish) {
        if (dish.sizes && dish.sizes.length > 0) {
            return `
                <div class="dish-sizes">
                    ${dish.sizes.map(size => `
                        <div class="size-option" 
                             data-size="${size.name}" 
                             data-price="${size.price}"
                             role="button"
                             aria-label="${size.name} - ${Utils.formatPrice(size.price)}">
                            <span class="size-label">${size.name}</span>
                            <span class="size-price">${Utils.formatPrice(size.price)}</span>
                            ${size.weight ? `<span class="size-weight">${size.weight}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="selected-price" aria-live="polite"></div>
            `;
        } else {
            return `
                <div class="dish-price single-price">
                    ${Utils.formatPrice(dish.price)}
                </div>
            `;
        }
    }
    
    // === UI HELPERS ===
    
    showLoadingState(container) {
        container.innerHTML = `
            <div class="menu-loading">
                <div class="loading-spinner"></div>
                <p>Завантаження страв...</p>
            </div>
        `;
    }
    
    showEmptyState(container) {
        const message = this.searchQuery 
            ? `Нічого не знайдено для "${this.searchQuery}"`
            : 'Страви в цій категорії відсутні';
            
        container.innerHTML = `
            <div class="menu-empty">
                <div class="empty-icon" aria-hidden="true">🔍</div>
                <h3>${message}</h3>
                <p>Спробуйте змінити критерії пошуку або оберіть іншу категорію</p>
                ${this.searchQuery || this.activeFilters.size > 0 ? `
                    <button class="btn btn-secondary clear-filters-btn">
                        Очистити фільтри
                    </button>
                ` : ''}
            </div>
        `;
        
        // Bind clear filters button
        const clearBtn = container.querySelector('.clear-filters-btn');
        if (clearBtn) {
            Utils.on(clearBtn, 'click', () => this.clearAllFilters());
        }
    }
    
    updateViewMode() {
        const grids = Utils.$('.dishes-grid');
        grids.forEach(grid => {
            grid.className = `dishes-grid view-${this.viewMode}`;
        });
    }
    
    updateResultsCount(count) {
        let counter = Utils.$('.results-count');
        
        if (!counter) {
            counter = Utils.createElement('div', {
                className: 'results-count',
                'aria-live': 'polite'
            });
            
            const controls = Utils.$('.menu-controls');
            if (controls) {
                controls.appendChild(counter);
            }
        }
        
        counter.textContent = `Знайдено: ${count} страв`;
        counter.style.display = this.searchQuery || this.activeFilters.size > 0 ? 'block' : 'none';
    }
    
    toggleSearchIndicator(show) {
        const searchContainer = Utils.$('.menu-search-container');
        if (searchContainer) {
            searchContainer.classList.toggle('has-query', show);
        }
        
        const clearBtn = Utils.$('.search-clear');
        if (clearBtn) {
            clearBtn.style.display = show ? 'block' : 'none';
        }
    }
    
    animatePanelChange(panel) {
        const dishCards = panel.querySelectorAll('.dish-card');
        
        dishCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    // === INTERACTIONS ===
    
    getSelectedSize(dishCard) {
        const selectedOption = dishCard.querySelector('.size-option.selected');
        
        if (selectedOption) {
            return {
                name: selectedOption.dataset.size,
                price: parseInt(selectedOption.dataset.price)
            };
        }
        
        return null;
    }
    
    showSizeSelectionPrompt(dishCard) {
        dishCard.classList.add('size-required');
        
        // Show visual feedback
        const sizeOptions = dishCard.querySelector('.dish-sizes');
        if (sizeOptions) {
            sizeOptions.classList.add('highlight');
            
            setTimeout(() => {
                sizeOptions.classList.remove('highlight');
                dishCard.classList.remove('size-required');
            }, 2000);
        }
        
        // Show toast message
        if (window.toastManager) {
            window.toastManager.show('Оберіть розмір страви', 'info');
        }
    }
    
    showAddedFeedback(btn, dish, selectedSize) {
        const originalText = btn.querySelector('.btn-text').textContent;
        const originalIcon = btn.querySelector('.btn-icon').textContent;
        
        // Update button state
        btn.classList.add('added');
        btn.querySelector('.btn-text').textContent = 'Додано';
        btn.querySelector('.btn-icon').textContent = '✓';
        
        // Reset after delay
        setTimeout(() => {
            btn.classList.remove('added');
            btn.querySelector('.btn-text').textContent = originalText;
            btn.querySelector('.btn-icon').textContent = originalIcon;
        }, 1500);
        
        // Animate button
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }
    
    openDishModal(dishId) {
        const dish = MenuDataService.getDishById(dishId);
        if (!dish) return;
        
        // Implementation would open a detailed modal
        // For now, just track the event
        this.trackEvent(ANALYTICS_EVENTS.DISH_VIEWED, {
            dish_id: dishId,
            dish_name: dish.name,
            category: dish.category
        });
        
        console.log('Opening dish modal for:', dish.name);
    }
    
    // === UTILITIES ===
    
    getItemsPerRow() {
        const grid = Utils.$('.dishes-grid.active');
        if (!grid) return 1;
        
        const gridStyle = window.getComputedStyle(grid);
        const columns = gridStyle.getPropertyValue('grid-template-columns');
        
        return columns.split(' ').length;
    }
    
    refreshIntersectionObserver() {
        if (this.observer) {
            this.observer.disconnect();
            
            // Re-observe all dish cards
            const dishCards = Utils.$('.dish-card:not(.loaded)');
            dishCards.forEach(card => this.observer.observe(card));
        }
    }
    
    clearAllFilters() {
        // Clear search
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.searchQuery = '';
        
        // Clear filters
        this.activeFilters.clear();
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Reset sort
        if (this.sortSelect) {
            this.sortSelect.value = 'popular';
        }
        this.currentSort = 'popular';
        
        // Update display
        this.updateMenuDisplay();
        this.toggleSearchIndicator(false);
        
        this.trackEvent(ANALYTICS_EVENTS.MENU_FILTERS_CLEARED);
    }
    
    // === PUBLIC API ===
    
    loadMenuData() {
        // This method would load menu data from API in production
        // For now, we use the imported static data
        console.log('📋 Menu data loaded:', Object.keys(MENU_DATA).map(cat => 
            `${cat}: ${MENU_DATA[cat].length} items`
        ));
    }
    
    showInitialCategory() {
        this.switchToCategory(this.activeCategory);
    }
    
    getCurrentCategory() {
        return this.activeCategory;
    }
    
    getActiveFilters() {
        return Array.from(this.activeFilters);
    }
    
    setCategory(category) {
        if (MENU_DATA[category]) {
            this.switchToCategory(category);
            return true;
        }
        return false;
    }
    
    search(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
        }
        this.handleSearch(query);
    }
    
    addFilter(filter) {
        if (!this.activeFilters.has(filter)) {
            this.activeFilters.add(filter);
            
            const filterBtn = Utils.$(`[data-filter="${filter}"]`);
            if (filterBtn) {
                filterBtn.classList.add('active');
                filterBtn.setAttribute('aria-pressed', 'true');
            }
            
            this.updateMenuDisplay();
            return true;
        }
        return false;
    }
    
    removeFilter(filter) {
        if (this.activeFilters.has(filter)) {
            this.activeFilters.delete(filter);
            
            const filterBtn = Utils.$(`[data-filter="${filter}"]`);
            if (filterBtn) {
                filterBtn.classList.remove('active');
                filterBtn.setAttribute('aria-pressed', 'false');
            }
            
            this.updateMenuDisplay();
            return true;
        }
        return false;
    }
    
    // === TRACKING ===
    
    trackEvent(eventName, data = {}) {
        if (window.analytics) {
            window.analytics.track(eventName, {
                ...data,
                component: 'menu',
                timestamp: Date.now()
            });
        }
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Clear caches
        this.renderedItems.clear();
        this.filterCache.clear();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clear references
        this.menuContainer = null;
        this.menuTabs = null;
        this.menuPanels = null;
        this.searchInput = null;
        this.filterButtons = null;
        this.sortSelect = null;
        
        console.log('🍽️ Menu Manager destroyed');
    }
}

export default MenuManager;setAttribute('aria-pressed', 'true');
        }
        
        this.updateMenuDisplay();
        this.trackEvent(ANALYTICS_EVENTS.MENU_FILTER_APPLIED, {
            filter: filter,
            active: !isActive,
            active_filters: Array.from(this.activeFilters)
        });
    }
    
    handleSortChange(sortValue) {
        this.currentSort = sortValue;
        this.updateMenuDisplay();
        
        this.trackEvent(ANALYTICS_EVENTS.MENU_SORTED, {
            sort_method: sortValue,
            category: this.activeCategory
        });
    }
    
    handleViewToggle(e) {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        
        const newView = btn.dataset.view;
        
        if (newView !== this.viewMode) {
            // Update button states
            Utils.$$('.view-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            
            btn.classList.add('active');
            btn.