// ===== MENU-DATA.JS - ДАНІ МЕНЮ =====

import { MENU_CATEGORIES } from './config.js';

// Повні дані меню на основі завантаженого Excel файлу
export const MENU_DATA = {
    [MENU_CATEGORIES.SHAWARMA]: [
        {
        id: 'family-set',
        name: 'Сімейний сет',
        description: '2 Шаурми + 2 Бургери + Картопля фрі + 4 Напої',
        originalPrice: 650,
        price: 520,
        discount: 20,
        category: 'combos',
        image: 'images/family-set.jpg',
        popular: true,
        rating: 4.7,
        items: ['shawarma-chicken', 'shawarma-pork', 'armenian-burger', 'classic-burger', 'fries', 'cola', 'cola', 'juice-orange', 'water'],
        validUntil: '2024-12-31',
        calories: 2190,
        preparationTime: 15,
        servings: 4
    },
    {
        id: 'lunch-deal',
        name: 'Бізнес-ланч',
        description: 'Гаряча страва + Гарнір + Напій + Десерт',
        originalPrice: 180,
        price: 140,
        discount: 22,
        category: 'combos',
        image: 'images/lunch-deal.jpg',
        availableHours: '11:00-16:00',
        items: ['grill-chicken-breast', 'rice-pilaf', 'tea-armenian', 'gata'],
        validUntil: '2024-12-31',
        calories: 647,
        preparationTime: 18
    },
    {
        id: 'vegetarian-combo',
        name: 'Вегетаріанський комбо',
        description: 'Овочева шаурма + Овочі гриль + Фреш',
        originalPrice: 220,
        price: 180,
        discount: 18,
        category: 'combos',
        image: 'images/vegetarian-combo.jpg',
        vegetarian: true,
        vegan: true,
        items: ['shawarma-veggie', 'grill-vegetables', 'juice-orange'],
        validUntil: '2024-12-31',
        calories: 540,
        preparationTime: 12
    }
];

// Популярні страви (топ-10)
export const POPULAR_DISHES = [
    'shawarma-chicken',
    'armenian-burger', 
    'grill-pork-shashlik',
    'lyulya-mixed',
    'shawarma-pork',
    'combo-armenian-picnic',
    'grill-beef-steak',
    'cheese-burger',
    'baklava',
    'coffee-armenian'
];

// Рекомендовані страви
export const RECOMMENDED_DISHES = [
    'shawarma-beef',
    'grill-lamb',
    'lyulya-beef',
    'sauce-armenian',
    'tan'
];

// Нові страви
export const NEW_DISHES = [
    'grill-fish',
    'veggie-burger',
    'combo-vegetarian'
];

// Категорії з додатковою інформацією
export const MENU_CATEGORIES_INFO = {
    [MENU_CATEGORIES.SHAWARMA]: {
        name: 'Шаурма',
        description: 'Традиційна близькосхідна страва з м\'ясом та овочами',
        icon: '🌯',
        color: '#D2001F',
        popular: true
    },
    [MENU_CATEGORIES.KEBAB]: {
        name: 'Кебаб',
        description: 'Ароматний люля-кебаб за вірменськими рецептами',
        icon: '🍢',
        color: '#FF6B35',
        popular: true
    },
    [MENU_CATEGORIES.GRILL]: {
        name: 'Гриль',
        description: 'М\'ясо та овочі приготовані на відкритому вогні',
        icon: '🔥',
        color: '#DAA520',
        premium: true
    },
    [MENU_CATEGORIES.BURGERS]: {
        name: 'Бургери',
        description: 'Соковиті бургери з різними начинками',
        icon: '🍔',
        color: '#4CAF50'
    },
    [MENU_CATEGORIES.HOTDOGS]: {
        name: 'Хот-доги',
        description: 'Швидкі та смачні хот-доги',
        icon: '🌭',
        color: '#FF9800'
    },
    [MENU_CATEGORIES.SIDES]: {
        name: 'Гарніри',
        description: 'Ідеальні доповнення до основних страв',
        icon: '🍟',
        color: '#607D8B'
    },
    [MENU_CATEGORIES.SAUCES]: {
        name: 'Соуси',
        description: 'Фірмові соуси власного приготування',
        icon: '🥄',
        color: '#795548'
    },
    [MENU_CATEGORIES.DRINKS]: {
        name: 'Напої',
        description: 'Освіжаючі напої та традиційні вірменські',
        icon: '🥤',
        color: '#2196F3'
    },
    [MENU_CATEGORIES.DESSERTS]: {
        name: 'Десерти',
        description: 'Традиційні вірменські солодощі',
        icon: '🍯',
        color: '#E91E63'
    }
};

// Фільтри для меню
export const MENU_FILTERS = {
    dietary: [
        { id: 'vegetarian', name: 'Вегетаріанське', icon: '🌱' },
        { id: 'vegan', name: 'Веганське', icon: '🌿' },
        { id: 'gluten-free', name: 'Без глютену', icon: '🚫' }
    ],
    price: [
        { id: 'budget', name: 'До 100₴', min: 0, max: 100 },
        { id: 'medium', name: '100-200₴', min: 100, max: 200 },
        { id: 'premium', name: 'Від 200₴', min: 200, max: 1000 }
    ],
    spice: [
        { id: 'mild', name: 'М\'яко', level: [0, 1] },
        { id: 'medium', name: 'Середньо', level: [2] },
        { id: 'hot', name: 'Гостро', level: [3] }
    ],
    preparation: [
        { id: 'quick', name: 'Швидко (до 10 хв)', max: 10 },
        { id: 'normal', name: 'Звичайно (10-20 хв)', min: 10, max: 20 },
        { id: 'slow', name: 'Довго (від 20 хв)', min: 20 }
    ]
};

// Алергени з описами
export const ALLERGENS_INFO = {
    'глютен': { name: 'Глютен', icon: '🌾', description: 'Містить пшеницю, жито, ячмінь' },
    'яйця': { name: 'Яйця', icon: '🥚', description: 'Містить курячі яйця' },
    'молоко': { name: 'Молоко', icon: '🥛', description: 'Містить лактозу' },
    'горіхи': { name: 'Горіхи', icon: '🥜', description: 'Може містити різні види горіхів' },
    'риба': { name: 'Риба', icon: '🐟', description: 'Містить рибу та рибні продукти' },
    'кунжут': { name: 'Кунжут', icon: '🌰', description: 'Містить насіння кунжуту' }
};

// Функції для роботи з меню
export class MenuDataService {
    // Отримати всі страви
    static getAllDishes() {
        return Object.values(MENU_DATA).flat();
    }
    
    // Отримати страви за категорією
    static getDishesByCategory(category) {
        return MENU_DATA[category] || [];
    }
    
    // Отримати страву за ID
    static getDishById(id) {
        const allDishes = this.getAllDishes();
        return allDishes.find(dish => dish.id === id);
    }
    
    // Пошук страв
    static searchDishes(query) {
        const allDishes = this.getAllDishes();
        const searchQuery = query.toLowerCase();
        
        return allDishes.filter(dish => 
            dish.name.toLowerCase().includes(searchQuery) ||
            dish.description.toLowerCase().includes(searchQuery) ||
            dish.category.toLowerCase().includes(searchQuery)
        );
    }
    
    // Фільтрація страв
    static filterDishes(filters) {
        let dishes = this.getAllDishes();
        
        // Фільтр за категорією
        if (filters.category) {
            dishes = dishes.filter(dish => dish.category === filters.category);
        }
        
        // Фільтр за ціною
        if (filters.priceRange) {
            dishes = dishes.filter(dish => {
                const price = dish.price || (dish.sizes ? dish.sizes[0].price : 0);
                return price >= filters.priceRange.min && price <= filters.priceRange.max;
            });
        }
        
        // Дієтичні фільтри
        if (filters.vegetarian) {
            dishes = dishes.filter(dish => dish.vegetarian);
        }
        
        if (filters.vegan) {
            dishes = dishes.filter(dish => dish.vegan);
        }
        
        // Фільтр за рівнем гостроти
        if (filters.spiceLevel !== undefined) {
            dishes = dishes.filter(dish => dish.spiceLevel === filters.spiceLevel);
        }
        
        // Фільтр за часом приготування
        if (filters.preparationTime) {
            dishes = dishes.filter(dish => 
                dish.preparationTime <= filters.preparationTime
            );
        }
        
        // Фільтр популярних
        if (filters.popular) {
            dishes = dishes.filter(dish => dish.popular);
        }
        
        // Фільтр преміум
        if (filters.premium) {
            dishes = dishes.filter(dish => dish.premium);
        }
        
        return dishes;
    }
    
    // Отримати популярні страви
    static getPopularDishes() {
        return POPULAR_DISHES.map(id => this.getDishById(id)).filter(Boolean);
    }
    
    // Отримати рекомендовані страви
    static getRecommendedDishes() {
        return RECOMMENDED_DISHES.map(id => this.getDishById(id)).filter(Boolean);
    }
    
    // Отримати нові страви
    static getNewDishes() {
        return NEW_DISHES.map(id => this.getDishById(id)).filter(Boolean);
    }
    
    // Отримати схожі страви
    static getSimilarDishes(dishId, limit = 4) {
        const dish = this.getDishById(dishId);
        if (!dish) return [];
        
        const sameCategoryDishes = this.getDishesByCategory(dish.category)
            .filter(d => d.id !== dishId);
        
        // Сортуємо за рейтингом та популярністю
        return sameCategoryDishes
            .sort((a, b) => {
                const scoreA = (a.rating || 0) + (a.popular ? 1 : 0);
                const scoreB = (b.rating || 0) + (b.popular ? 1 : 0);
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }
    
    // Отримати спеціальні пропозиції
    static getSpecialOffers() {
        return SPECIAL_OFFERS;
    }
    
    // Отримати активні спеціальні пропозиції
    static getActiveOffers() {
        const now = new Date();
        return SPECIAL_OFFERS.filter(offer => {
            if (!offer.validUntil) return true;
            return new Date(offer.validUntil) > now;
        });
    }
    
    // Отримати комбо за ID
    static getComboById(id) {
        return SPECIAL_OFFERS.find(offer => offer.id === id);
    }
    
    // Розрахувати загальну ціну комбо
    static calculateComboPrice(comboId) {
        const combo = this.getComboById(comboId);
        if (!combo) return 0;
        
        let totalPrice = 0;
        combo.items.forEach(itemId => {
            const dish = this.getDishById(itemId);
            if (dish) {
                totalPrice += dish.price || (dish.sizes ? dish.sizes[0].price : 0);
            }
        });
        
        return {
            originalPrice: totalPrice,
            discountedPrice: combo.price,
            savings: totalPrice - combo.price,
            discount: combo.discount
        };
    }
    
    // Отримати інформацію про алергени страви
    static getDishAllergens(dishId) {
        const dish = this.getDishById(dishId);
        if (!dish || !dish.allergens) return [];
        
        return dish.allergens.map(allergen => ALLERGENS_INFO[allergen]).filter(Boolean);
    }
    
    // Отримати статистику меню
    static getMenuStats() {
        const allDishes = this.getAllDishes();
        
        return {
            totalDishes: allDishes.length,
            categoriesCount: Object.keys(MENU_DATA).length,
            vegetarianCount: allDishes.filter(d => d.vegetarian).length,
            veganCount: allDishes.filter(d => d.vegan).length,
            popularCount: allDishes.filter(d => d.popular).length,
            premiumCount: allDishes.filter(d => d.premium).length,
            averagePrice: Math.round(
                allDishes.reduce((sum, dish) => {
                    const price = dish.price || (dish.sizes ? dish.sizes[0].price : 0);
                    return sum + price;
                }, 0) / allDishes.length
            ),
            averageRating: (
                allDishes.reduce((sum, dish) => sum + (dish.rating || 0), 0) / allDishes.length
            ).toFixed(1)
        };
    }
}

// Експорт всіх даних
export default {
    MENU_DATA,
    SPECIAL_OFFERS,
    POPULAR_DISHES,
    RECOMMENDED_DISHES,
    NEW_DISHES,
    MENU_CATEGORIES_INFO,
    MENU_FILTERS,
    ALLERGENS_INFO,
    MenuDataService
};
            id: 'shawarma-chicken',
            name: 'Шаурма Курка',
            description: 'Соковита курка, мариновані овочі, свіжа зелень та фірмовий соус у м\'якому лаваші',
            category: MENU_CATEGORIES.SHAWARMA,
            image: 'images/shawarma-chicken.jpg',
            popular: true,
            rating: 4.9,
            reviewsCount: 156,
            preparationTime: 8, // хвилин
            calories: 420,
            allergens: ['глютен'],
            spiceLevel: 1, // 0-3
            sizes: [
                { name: 'Мала', price: 115, weight: '200г' },
                { name: 'Звичайна', price: 125, weight: '280г' },
                { name: 'Подвійна', price: 160, weight: '350г' }
            ]
        },
        {
            id: 'shawarma-pork',
            name: 'Шаурма Свинина',
            description: 'Ніжна свинина з пікантним маринадом, свіжі овочі та авторський соус',
            category: MENU_CATEGORIES.SHAWARMA,
            image: 'images/shawarma-pork.jpg',
            rating: 4.8,
            reviewsCount: 124,
            preparationTime: 8,
            calories: 450,
            allergens: ['глютен'],
            spiceLevel: 2,
            sizes: [
                { name: 'Мала', price: 120, weight: '200г' },
                { name: 'Звичайна', price: 130, weight: '280г' },
                { name: 'Подвійна', price: 170, weight: '350г' }
            ]
        },
        {
            id: 'shawarma-beef',
            name: 'Шаурма Телятина',
            description: 'Преміум телятина, особливий маринад, овочі гриль та трюфельний соус',
            category: MENU_CATEGORIES.SHAWARMA,
            image: 'images/shawarma-beef.jpg',
            premium: true,
            rating: 4.9,
            reviewsCount: 89,
            preparationTime: 10,
            calories: 380,
            allergens: ['глютен'],
            spiceLevel: 1,
            sizes: [
                { name: 'Мала', price: 125, weight: '200г' },
                { name: 'Звичайна', price: 135, weight: '280г' },
                { name: 'Подвійна', price: 180, weight: '350г' }
            ]
        },
        {
            id: 'shawarma-veggie',
            name: 'Шаурма Овочевий',
            description: 'Свіжі овочі гриль, хумус та вірменські спеції',
            category: MENU_CATEGORIES.SHAWARMA,
            image: 'images/shawarma-veggie.jpg',
            vegetarian: true,
            vegan: true,
            rating: 4.7,
            reviewsCount: 67,
            preparationTime: 6,
            calories: 280,
            allergens: ['глютен', 'кунжут'],
            spiceLevel: 1,
            price: 100,
            weight: '250г'
        }
    ],
    
    [MENU_CATEGORIES.KEBAB]: [
        {
            id: 'lyulya-chicken',
            name: 'Люля-кебаб у лаваші Курка',
            description: 'Соковитий люля-кебаб з курки у традиційному лаваші з овочами та соусом',
            category: MENU_CATEGORIES.KEBAB,
            image: 'images/lyulya-chicken.jpg',
            rating: 4.8,
            reviewsCount: 98,
            preparationTime: 12,
            calories: 390,
            allergens: ['глютен'],
            spiceLevel: 2,
            price: 100,
            weight: '280г'
        },
        {
            id: 'lyulya-pork',
            name: 'Люля-кебаб у лаваші Свинина',
            description: 'Ароматний люля-кебаб зі свинини з традиційними спеціями та свіжими овочами',
            category: MENU_CATEGORIES.KEBAB,
            image: 'images/lyulya-pork.jpg',
            rating: 4.8,
            reviewsCount: 87,
            preparationTime: 12,
            calories: 420,
            allergens: ['глютен'],
            spiceLevel: 2,
            price: 110,
            weight: '280г'
        },
        {
            id: 'lyulya-beef',
            name: 'Люля-кебаб у лаваші Телятина',
            description: 'Преміум люля-кебаб з телятини з вірменськими спеціями',
            category: MENU_CATEGORIES.KEBAB,
            image: 'images/lyulya-beef.jpg',
            premium: true,
            rating: 4.9,
            reviewsCount: 54,
            preparationTime: 15,
            calories: 400,
            allergens: ['глютен'],
            spiceLevel: 2,
            price: 120,
            weight: '280г'
        },
        {
            id: 'lyulya-mixed',
            name: 'Люля-кебаб Мікс',
            description: 'Асорті з курки та свинини з різноманітними соусами',
            category: MENU_CATEGORIES.KEBAB,
            image: 'images/lyulya-mixed.jpg',
            popular: true,
            rating: 4.8,
            reviewsCount: 112,
            preparationTime: 12,
            calories: 410,
            allergens: ['глютен'],
            spiceLevel: 2,
            price: 115,
            weight: '300г'
        }
    ],
    
    [MENU_CATEGORIES.GRILL]: [
        {
            id: 'grill-chicken-breast',
            name: 'Куряче філе гриль',
            description: 'Ніжне куряче філе на грилі з вірменськими спеціями та овочами',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-chicken.jpg',
            rating: 4.7,
            reviewsCount: 76,
            preparationTime: 15,
            calories: 320,
            allergens: [],
            spiceLevel: 1,
            price: 180,
            weight: '250г',
            protein: 35
        },
        {
            id: 'grill-pork-shashlik',
            name: 'Свинячий шашлик',
            description: 'Класичний вірменський шашлик зі свинини на мангалі',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-pork.jpg',
            popular: true,
            rating: 4.9,
            reviewsCount: 143,
            preparationTime: 20,
            calories: 480,
            allergens: [],
            spiceLevel: 2,
            price: 220,
            weight: '300г',
            protein: 40
        },
        {
            id: 'grill-beef-steak',
            name: 'Стейк з телятини',
            description: 'Соковитий стейк з телятини середнього прожарювання',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-beef.jpg',
            premium: true,
            rating: 4.9,
            reviewsCount: 65,
            preparationTime: 18,
            calories: 450,
            allergens: [],
            spiceLevel: 1,
            price: 280,
            weight: '280г',
            protein: 45
        },
        {
            id: 'grill-lamb',
            name: 'Шашлик з баранини',
            description: 'Традиційний вірменський шашлик з молодої баранини',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-lamb.jpg',
            premium: true,
            rating: 5.0,
            reviewsCount: 34,
            preparationTime: 25,
            calories: 520,
            allergens: [],
            spiceLevel: 2,
            price: 320,
            weight: '300г',
            protein: 42
        },
        {
            id: 'grill-vegetables',
            name: 'Овочі гриль',
            description: 'Асорті овочів: кабачки, перець, баклажани, помідори',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-vegetables.jpg',
            vegetarian: true,
            vegan: true,
            rating: 4.6,
            reviewsCount: 45,
            preparationTime: 12,
            calories: 150,
            allergens: [],
            spiceLevel: 0,
            price: 120,
            weight: '300г',
            fiber: 8
        },
        {
            id: 'grill-fish',
            name: 'Форель на грилі',
            description: 'Свіжа форель з лимоном та середземноморськими травами',
            category: MENU_CATEGORIES.GRILL,
            image: 'images/grill-fish.jpg',
            rating: 4.8,
            reviewsCount: 52,
            preparationTime: 18,
            calories: 380,
            allergens: ['риба'],
            spiceLevel: 1,
            price: 250,
            weight: '280г',
            protein: 38,
            omega3: true
        }
    ],
    
    [MENU_CATEGORIES.BURGERS]: [
        {
            id: 'armenian-burger',
            name: 'Вірменський бургер',
            description: 'Бургер з люля-кебабом, овочами та фірмовим соусом на лаваші',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/armenian-burger.jpg',
            popular: true,
            rating: 4.8,
            reviewsCount: 189,
            preparationTime: 10,
            calories: 520,
            allergens: ['глютен', 'яйця'],
            spiceLevel: 2,
            price: 150,
            weight: '350г'
        },
        {
            id: 'classic-burger',
            name: 'Класичний бургер',
            description: 'Яловича котлета, салат, помідор, цибуля, огірок, соус',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/classic-burger.jpg',
            rating: 4.7,
            reviewsCount: 156,
            preparationTime: 8,
            calories: 480,
            allergens: ['глютен', 'яйця'],
            spiceLevel: 0,
            price: 140,
            weight: '320г'
        },
        {
            id: 'chicken-burger',
            name: 'Чікен бургер',
            description: 'Куряча котлета у пряній панірувці з овочами',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/chicken-burger.jpg',
            rating: 4.6,
            reviewsCount: 134,
            preparationTime: 10,
            calories: 450,
            allergens: ['глютен', 'яйця'],
            spiceLevel: 1,
            price: 135,
            weight: '300г'
        },
        {
            id: 'cheese-burger',
            name: 'Чізбургер',
            description: 'Подвійна котлета з сиром чеддер та беконом',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/cheese-burger.jpg',
            rating: 4.8,
            reviewsCount: 98,
            preparationTime: 12,
            calories: 650,
            allergens: ['глютен', 'яйця', 'молоко'],
            spiceLevel: 1,
            price: 170,
            weight: '400г'
        },
        {
            id: 'fish-burger',
            name: 'Фіш бургер',
            description: 'Філе риби в панірувці з соусом тар-тар',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/fish-burger.jpg',
            rating: 4.5,
            reviewsCount: 67,
            preparationTime: 12,
            calories: 420,
            allergens: ['глютен', 'яйця', 'риба'],
            spiceLevel: 0,
            price: 160,
            weight: '320г'
        },
        {
            id: 'veggie-burger',
            name: 'Вегетаріанський бургер',
            description: 'Котлета з квасолі та овочів з авокадо',
            category: MENU_CATEGORIES.BURGERS,
            image: 'images/veggie-burger.jpg',
            vegetarian: true,
            rating: 4.4,
            reviewsCount: 45,
            preparationTime: 10,
            calories: 380,
            allergens: ['глютен'],
            spiceLevel: 0,
            price: 125,
            weight: '280г'
        }
    ],
    
    [MENU_CATEGORIES.HOTDOGS]: [
        {
            id: 'hotdog-smoked',
            name: 'Хот-дог Копчена сосиска',
            description: 'Копчена сосиска у булочці з овочами та соусами',
            category: MENU_CATEGORIES.HOTDOGS,
            image: 'images/hotdog-smoked.jpg',
            rating: 4.5,
            reviewsCount: 78,
            preparationTime: 5,
            calories: 350,
            allergens: ['глютен'],
            spiceLevel: 1,
            price: 80,
            weight: '200г'
        },
        {
            id: 'hotdog-hunting',
            name: 'Хот-дог Мисливська сосиска',
            description: 'Мисливська сосиска з кислою капустою та гірчицею',
            category: MENU_CATEGORIES.HOTDOGS,
            image: 'images/hotdog-hunting.jpg',
            rating: 4.6,
            reviewsCount: 65,
            preparationTime: 5,
            calories: 380,
            allergens: ['глютен'],
            spiceLevel: 2,
            price: 90,
            weight: '220г'
        }
    ],
    
    [MENU_CATEGORIES.SIDES]: [
        {
            id: 'fries',
            name: 'Картопля фрі',
            description: 'Хрустка картопля фрі з морською сіллю',
            category: MENU_CATEGORIES.SIDES,
            image: 'images/fries.jpg',
            vegetarian: true,
            vegan: true,
            rating: 4.5,
            reviewsCount: 234,
            preparationTime: 6,
            calories: 280,
            allergens: [],
            spiceLevel: 0,
            price: 60,
            weight: '150г'
        },
        {
            id: 'rice-pilaf',
            name: 'Плов',
            description: 'Традиційний вірменський плов з овочами',
            category: MENU_CATEGORIES.SIDES,
            image: 'images/rice-pilaf.jpg',
            vegetarian: true,
            rating: 4.7,
            reviewsCount: 89,
            preparationTime: 8,
            calories: 320,
            allergens: [],
            spiceLevel: 1,
            price: 80,
            weight: '200г'
        },
        {
            id: 'grilled-vegetables-side',
            name: 'Овочі гриль (гарнір)',
            description: 'Сезонні овочі приготовані на грилі',
            category: MENU_CATEGORIES.SIDES,
            image: 'images/grilled-vegetables-side.jpg',
            vegetarian: true,
            vegan: true,
            rating: 4.6,
            reviewsCount: 67,
            preparationTime: 10,
            calories: 120,
            allergens: [],
            spiceLevel: 0,
            price: 70,
            weight: '180г'
        }
    ],
    
    [MENU_CATEGORIES.SAUCES]: [
        {
            id: 'sauce-garlic',
            name: 'Часниковий соус',
            description: 'Кремовий часниковий соус власного приготування',
            category: MENU_CATEGORIES.SAUCES,
            image: 'images/sauce-garlic.jpg',
            vegetarian: true,
            rating: 4.8,
            reviewsCount: 145,
            preparationTime: 1,
            calories: 80,
            allergens: ['яйця'],
            spiceLevel: 1,
            price: 15,
            weight: '30г'
        },
        {
            id: 'sauce-spicy',
            name: 'Гострий соус',
            description: 'Пікантний соус з червоним перцем',
            category: MENU_CATEGORIES.SAUCES,
            image: 'images/sauce-spicy.jpg',
            vegetarian: true,
            vegan: true,
            rating: 4.7,
            reviewsCount: 98,
            preparationTime: 1,
            calories: 25,
            allergens: [],
            spiceLevel: 3,
            price: 15,
            weight: '30г'
        },
        {
            id: 'sauce-armenian',
            name: 'Вірменський соус',
            description: 'Традиційний вірменський соус з травами',
            category: MENU_CATEGORIES.SAUCES,
            image: 'images/sauce-armenian.jpg',
            vegetarian: true,
            rating: 4.9,
            reviewsCount: 167,
            preparationTime: 1,
            calories: 45,
            allergens: [],
            spiceLevel: 1,
            price: 20,
            weight: '30г'
        }
    ],
    
    [MENU_CATEGORIES.DRINKS]: [
        {
            id: 'tan',
            name: 'Тан',
            description: 'Традиційний вірменський кисломолочний напій',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/tan.jpg',
            rating: 4.6,
            reviewsCount: 87,
            preparationTime: 2,
            calories: 45,
            allergens: ['молоко'],
            price: 35,
            volume: '330мл'
        },
        {
            id: 'coffee-armenian',
            name: 'Вірменська кава',
            description: 'Міцна ароматна кава за традиційним рецептом',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/coffee-armenian.jpg',
            rating: 4.8,
            reviewsCount: 156,
            preparationTime: 5,
            calories: 5,
            allergens: [],
            caffeine: true,
            price: 45,
            volume: '150мл'
        },
        {
            id: 'tea-armenian',
            name: 'Вірменський чай',
            description: 'Гірський чай з травами',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/tea-armenian.jpg',
            rating: 4.5,
            reviewsCount: 78,
            preparationTime: 3,
            calories: 2,
            allergens: [],
            price: 30,
            volume: '200мл'
        },
        {
            id: 'cola',
            name: 'Кола',
            description: 'Класична кола 0.33л',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/cola.jpg',
            rating: 4.0,
            reviewsCount: 234,
            preparationTime: 1,
            calories: 140,
            allergens: [],
            caffeine: true,
            price: 25,
            volume: '330мл'
        },
        {
            id: 'water',
            name: 'Вода',
            description: 'Питна вода 0.5л',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/water.jpg',
            rating: 4.0,
            reviewsCount: 45,
            preparationTime: 1,
            calories: 0,
            allergens: [],
            price: 20,
            volume: '500мл'
        },
        {
            id: 'juice-orange',
            name: 'Апельсиновий сік',
            description: 'Свіжовичавлений апельсиновий сік',
            category: MENU_CATEGORIES.DRINKS,
            image: 'images/juice-orange.jpg',
            rating: 4.3,
            reviewsCount: 89,
            preparationTime: 2,
            calories: 110,
            allergens: [],
            vitaminC: true,
            price: 40,
            volume: '250мл'
        }
    ],
    
    [MENU_CATEGORIES.DESSERTS]: [
        {
            id: 'baklava',
            name: 'Пахлава',
            description: 'Традиційна вірменська пахлава з горіхами та медом',
            category: MENU_CATEGORIES.DESSERTS,
            image: 'images/baklava.jpg',
            rating: 4.9,
            reviewsCount: 123,
            preparationTime: 3,
            calories: 320,
            allergens: ['глютен', 'горіхи'],
            price: 65,
            weight: '120г'
        },
        {
            id: 'gata',
            name: 'Гата',
            description: 'Вірменська солодка випічка з корицею',
            category: MENU_CATEGORIES.DESSERTS,
            image: 'images/gata.jpg',
            rating: 4.7,
            reviewsCount: 89,
            preparationTime: 3,
            calories: 280,
            allergens: ['глютен', 'яйця', 'молоко'],
            price: 55,
            weight: '100г'
        }
    ]
};

// Комбо та спеціальні пропозиції
export const SPECIAL_OFFERS = [
    {
        id: 'combo-armenian-picnic',
        name: 'Комбо "Вірменський пікнік"',
        description: 'Шаурма + Люля-кебаб + Напій + Соус',
        originalPrice: 280,
        price: 220,
        discount: 21, // відсоток
        category: 'combos',
        image: 'images/combo-armenian.jpg',
        popular: true,
        rating: 4.8,
        items: ['shawarma-chicken', 'lyulya-chicken', 'tan', 'sauce-armenian'],
        validUntil: '2024-12-31',
        calories: 855,
        preparationTime: 12
    },
    {
        id: 'combo-grill-master',
        name: 'Гриль майстер',
        description: 'Шашлик + Овочі гриль + Плов + Тан',
        originalPrice: 420,
        price: 350,
        discount: 17,
        category: 'combos',
        image: 'images/combo-grill.jpg',
        rating: 4.9,
        items: ['grill-pork-shashlik', 'grill-vegetables', 'rice-pilaf', 'tan'],
        validUntil: '2024-12-31',
        calories: 1025,
        preparationTime: 20
    },
    {