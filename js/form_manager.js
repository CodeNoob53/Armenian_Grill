// ===== FORM-MANAGER.JS - ВАЛІДАЦІЯ ТА ВІДПРАВКА ФОРМ =====

// Core utilities and configuration
import { Utils, StorageUtils } from './utils.js';
import { CONFIG, MESSAGES, VALIDATION_RULES, ANALYTICS_EVENTS } from './config.js';

// Menu data and services
import { MenuDataService } from './menu-data.js';

export class FormManager {
    constructor() {
        // State
        this.forms = new Map();
        this.validationRules = new Map();
        this.customValidators = new Map();
        this.submissionQueue = [];
        this.isOffline = !navigator.onLine;
        
        // Configuration
        this.defaultOptions = {
            validateOnBlur: true,
            validateOnInput: false,
            showSuccessState: true,
            clearOnSubmit: true,
            enableRealTimeValidation: true,
            autoSave: false,
            autoSaveDelay: 2000
        };
        
        this.init();
    }
    
    init() {
        this.setupDefaultValidators();
        this.bindGlobalEvents();
        this.detectForms();
        this.setupOfflineHandling();
        
        console.log('📝 Form Manager initialized');
    }
    
    setupDefaultValidators() {
        // Email validator
        this.addCustomValidator('email', {
            validate: (value) => VALIDATION_RULES.email.pattern.test(value),
            message: VALIDATION_RULES.email.message
        });
        
        // Phone validator
        this.addCustomValidator('phone', {
            validate: (value) => {
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length >= 10 && cleaned.length <= 15;
            },
            message: VALIDATION_RULES.phone.message,
            format: (value) => Utils.formatPhoneInput(value)
        });
        
        // Name validator
        this.addCustomValidator('name', {
            validate: (value) => VALIDATION_RULES.name.pattern.test(value),
            message: VALIDATION_RULES.name.message
        });
        
        // Required validator
        this.addCustomValidator('required', {
            validate: (value) => value.trim().length > 0,
            message: MESSAGES.errors.required
        });
        
        // Min length validator
        this.addCustomValidator('minlength', {
            validate: (value, minLength) => value.length >= minLength,
            message: (minLength) => `Мінімум ${minLength} символів`
        });
        
        // Max length validator
        this.addCustomValidator('maxlength', {
            validate: (value, maxLength) => value.length <= maxLength,
            message: (maxLength) => `Максимум ${maxLength} символів`
        });
        
        // Password strength validator
        this.addCustomValidator('password', {
            validate: (value) => {
                const hasLower = /[a-z]/.test(value);
                const hasUpper = /[A-Z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasMinLength = value.length >= 8;
                return hasLower && hasUpper && hasNumber && hasMinLength;
            },
            message: 'Пароль повинен містити мінімум 8 символів, великі та малі літери, цифри'
        });
        
        // Confirm password validator
        this.addCustomValidator('confirm-password', {
            validate: (value, originalValue) => value === originalValue,
            message: 'Паролі не співпадають'
        });
        
        // URL validator
        this.addCustomValidator('url', {
            validate: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Введіть коректний URL'
        });
        
        // Date validator
        this.addCustomValidator('date', {
            validate: (value) => {
                const date = new Date(value);
                return date instanceof Date && !isNaN(date);
            },
            message: 'Введіть коректну дату'
        });
        
        // Age validator
        this.addCustomValidator('age', {
            validate: (value, minAge = 18) => {
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                return age >= minAge;
            },
            message: (minAge = 18) => `Вік повинен бути мінімум ${minAge} років`
        });
    }
    
    bindGlobalEvents() {
        // Auto-detect forms when they're added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const forms = node.matches('form') ? [node] : Array.from(node.querySelectorAll('form'));
                        forms.forEach(form => this.registerForm(form));
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Online/offline events
        window.addEventListener('online', () => {
            this.isOffline = false;
            this.processSubmissionQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOffline = true;
        });
        
        // Page visibility change - save forms
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoSaveAllForms();
            }
        });
        
        // Before unload - warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            const hasUnsavedChanges = Array.from(this.forms.values()).some(form => form.hasUnsavedChanges);
            
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = MESSAGES.warnings.unsavedChanges;
                return e.returnValue;
            }
        });
    }
    
    detectForms() {
        const forms = Utils.$$('form');
        forms.forEach(form => this.registerForm(form));
    }
    
    setupOfflineHandling() {
        // Service worker for offline form submissions
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.sync) {
                    // Background sync support
                    this.backgroundSyncSupported = true;
                }
            });
        }
    }
    
    // === FORM REGISTRATION ===
    
    registerForm(formElement, options = {}) {
        if (this.forms.has(formElement)) {
            return this.forms.get(formElement);
        }
        
        const formConfig = {
            element: formElement,
            id: formElement.id || Utils.generateId('form'),
            options: { ...this.defaultOptions, ...options },
            fields: new Map(),
            isValid: false,
            isSubmitting: false,
            hasUnsavedChanges: false,
            lastValidation: null,
            autoSaveData: null,
            submissionAttempts: 0
        };
        
        this.forms.set(formElement, formConfig);
        this.initializeForm(formConfig);
        
        console.log('📝 Form registered:', formConfig.id);
        return formConfig;
    }
    
    initializeForm(formConfig) {
        const { element, options } = formConfig;
        
        // Add CSS classes
        element.classList.add('form-managed');
        
        // Set novalidate to use custom validation
        element.setAttribute('novalidate', 'true');
        
        // Discover and register fields
        this.discoverFields(formConfig);
        
        // Bind events
        this.bindFormEvents(formConfig);
        
        // Setup auto-save if enabled
        if (options.autoSave) {
            this.setupAutoSave(formConfig);
        }
        
        // Load saved data if available
        this.loadSavedData(formConfig);
        
        // Initial validation
        this.validateForm(formConfig, false);
    }
    
    discoverFields(formConfig) {
        const inputs = formConfig.element.querySelectorAll(
            'input, textarea, select'
        );
        
        inputs.forEach(input => {
            this.registerField(formConfig, input);
        });
    }
    
    registerField(formConfig, fieldElement) {
        const fieldConfig = {
            element: fieldElement,
            name: fieldElement.name || fieldElement.id,
            type: fieldElement.type || 'text',
            required: fieldElement.hasAttribute('required'),
            validators: [],
            isValid: false,
            hasBeenFocused: false,
            lastValue: fieldElement.value,
            errorElement: null
        };
        
        // Discover validators from attributes
        this.discoverValidators(fieldConfig);
        
        // Create error element
        this.createErrorElement(fieldConfig);
        
        // Store field
        formConfig.fields.set(fieldElement, fieldConfig);
        
        return fieldConfig;
    }
    
    discoverValidators(fieldConfig) {
        const { element } = fieldConfig;
        
        // Required validator
        if (element.hasAttribute('required')) {
            fieldConfig.validators.push({
                type: 'required',
                params: []
            });
        }
        
        // Type-based validators
        if (element.type === 'email') {
            fieldConfig.validators.push({
                type: 'email',
                params: []
            });
        }
        
        if (element.type === 'tel') {
            fieldConfig.validators.push({
                type: 'phone',
                params: []
            });
        }
        
        if (element.type === 'url') {
            fieldConfig.validators.push({
                type: 'url',
                params: []
            });
        }
        
        if (element.type === 'date' && element.hasAttribute('data-min-age')) {
            fieldConfig.validators.push({
                type: 'age',
                params: [parseInt(element.getAttribute('data-min-age'))]
            });
        }
        
        // Attribute-based validators
        if (element.hasAttribute('minlength')) {
            fieldConfig.validators.push({
                type: 'minlength',
                params: [parseInt(element.getAttribute('minlength'))]
            });
        }
        
        if (element.hasAttribute('maxlength')) {
            fieldConfig.validators.push({
                type: 'maxlength',
                params: [parseInt(element.getAttribute('maxlength'))]
            });
        }
        
        // Custom validators from data attributes
        if (element.hasAttribute('data-validator')) {
            const validatorName = element.getAttribute('data-validator');
            fieldConfig.validators.push({
                type: validatorName,
                params: []
            });
        }
        
        // Name-based validators
        if (fieldConfig.name === 'name' || fieldConfig.name.includes('name')) {
            fieldConfig.validators.push({
                type: 'name',
                params: []
            });
        }
        
        if (fieldConfig.name === 'password') {
            fieldConfig.validators.push({
                type: 'password',
                params: []
            });
        }
        
        if (fieldConfig.name === 'confirm-password' || fieldConfig.name === 'password-confirm') {
            fieldConfig.validators.push({
                type: 'confirm-password',
                params: ['password'] // Reference field name
            });
        }
    }
    
    createErrorElement(fieldConfig) {
        let errorElement = fieldConfig.element.parentNode.querySelector('.field-error');
        
        if (!errorElement) {
            errorElement = Utils.createElement('div', {
                className: 'field-error',
                role: 'alert',
                'aria-live': 'polite'
            });
            
            const formGroup = fieldConfig.element.closest('.form-group, .field-group');
            if (formGroup) {
                formGroup.appendChild(errorElement);
            } else {
                Utils.insertAfter(errorElement, fieldConfig.element);
            }
        }
        
        fieldConfig.errorElement = errorElement;
        
        // Associate error with field for accessibility
        const errorId = Utils.generateId('error');
        errorElement.id = errorId;
        fieldConfig.element.setAttribute('aria-describedby', errorId);
    }
    
    // === EVENT BINDING ===
    
    bindFormEvents(formConfig) {
        const { element, options } = formConfig;
        
        // Form submission
        Utils.on(element, 'submit', (e) => this.handleFormSubmit(e, formConfig));
        
        // Field events
        formConfig.fields.forEach((fieldConfig, fieldElement) => {
            this.bindFieldEvents(formConfig, fieldConfig);
        });
        
        // Form change detection
        Utils.on(element, 'input', () => {
            formConfig.hasUnsavedChanges = true;
        });
        
        Utils.on(element, 'change', () => {
            formConfig.hasUnsavedChanges = true;
        });
    }
    
    bindFieldEvents(formConfig, fieldConfig) {
        const { element } = fieldConfig;
        const { options } = formConfig;
        
        // Focus events
        Utils.on(element, 'focus', () => {
            fieldConfig.hasBeenFocused = true;
            this.clearFieldError(fieldConfig);
        });
        
        // Blur validation
        if (options.validateOnBlur) {
            Utils.on(element, 'blur', () => {
                if (fieldConfig.hasBeenFocused) {
                    this.validateField(formConfig, fieldConfig);
                }
            });
        }
        
        // Input validation
        if (options.validateOnInput || options.enableRealTimeValidation) {
            Utils.on(element, 'input', Utils.debounce(() => {
                if (fieldConfig.hasBeenFocused) {
                    this.validateField(formConfig, fieldConfig);
                }
                
                // Format field if formatter is available
                this.formatField(fieldConfig);
            }, 300));
        }
        
        // Special handling for phone inputs
        if (element.type === 'tel') {
            Utils.on(element, 'input', (e) => {
                e.target.value = Utils.formatPhoneInput(e.target.value);
            });
        }
        
        // Password strength indicator
        if (fieldConfig.name === 'password') {
            Utils.on(element, 'input', () => {
                this.updatePasswordStrength(fieldConfig);
            });
        }
    }
    
    // === VALIDATION ===
    
    validateForm(formConfig, showErrors = true) {
        let isValid = true;
        const errors = [];
        
        formConfig.fields.forEach((fieldConfig) => {
            const fieldValid = this.validateField(formConfig, fieldConfig, showErrors);
            if (!fieldValid) {
                isValid = false;
                errors.push({
                    field: fieldConfig.name,
                    message: fieldConfig.lastError
                });
            }
        });
        
        formConfig.isValid = isValid;
        formConfig.lastValidation = {
            timestamp: Date.now(),
            isValid,
            errors
        };
        
        // Update form state
        this.updateFormState(formConfig);
        
        return isValid;
    }
    
    validateField(formConfig, fieldConfig, showErrors = true) {
        const { element, validators } = fieldConfig;
        const value = element.value.trim();
        
        // Skip validation if field is disabled or readonly
        if (element.disabled || element.readOnly) {
            return true;
        }
        
        let isValid = true;
        let errorMessage = '';
        
        // Run all validators
        for (const validator of validators) {
            const result = this.runValidator(validator, value, formConfig, fieldConfig);
            
            if (!result.isValid) {
                isValid = false;
                errorMessage = result.message;
                break; // Stop at first error
            }
        }
        
        fieldConfig.isValid = isValid;
        fieldConfig.lastError = errorMessage;
        
        if (showErrors) {
            if (isValid) {
                this.showFieldSuccess(fieldConfig);
            } else {
                this.showFieldError(fieldConfig, errorMessage);
            }
        }
        
        return isValid;
    }
    
    runValidator(validator, value, formConfig, fieldConfig) {
        const validatorFunc = this.customValidators.get(validator.type);
        
        if (!validatorFunc) {
            console.warn('Unknown validator:', validator.type);
            return { isValid: true };
        }
        
        try {
            // Handle reference field validators (like confirm-password)
            if (validator.params.length > 0 && typeof validator.params[0] === 'string') {
                const refFieldName = validator.params[0];
                const refField = Array.from(formConfig.fields.entries())
                    .find(([el, config]) => config.name === refFieldName);
                
                if (refField) {
                    const refValue = refField[0].value;
                    const isValid = validatorFunc.validate(value, refValue);
                    const message = typeof validatorFunc.message === 'function' 
                        ? validatorFunc.message(refValue)
                        : validatorFunc.message;
                    
                    return { isValid, message };
                }
            }
            
            // Regular validation
            const isValid = validatorFunc.validate(value, ...validator.params);
            const message = typeof validatorFunc.message === 'function' 
                ? validatorFunc.message(...validator.params)
                : validatorFunc.message;
            
            return { isValid, message };
        } catch (error) {
            console.error('Validator error:', error);
            return { isValid: false, message: 'Помилка валідації' };
        }
    }
    
    // === UI FEEDBACK ===
    
    showFieldError(fieldConfig, message) {
        const { element, errorElement } = fieldConfig;
        
        // Update field state
        element.classList.add('field-error');
        element.classList.remove('field-success');
        element.setAttribute('aria-invalid', 'true');
        
        // Update form group
        const formGroup = element.closest('.form-group, .field-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            formGroup.classList.remove('has-success');
        }
        
        // Show error message
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        // Accessibility announcement
        this.announceError(message);
    }
    
    showFieldSuccess(fieldConfig) {
        const { element, errorElement } = fieldConfig;
        
        // Update field state
        element.classList.remove('field-error');
        element.classList.add('field-success');
        element.setAttribute('aria-invalid', 'false');
        
        // Update form group
        const formGroup = element.closest('.form-group, .field-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
            formGroup.classList.add('has-success');
        }
        
        // Hide error message
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
    
    clearFieldError(fieldConfig) {
        const { element, errorElement } = fieldConfig;
        
        // Clear field state
        element.classList.remove('field-error', 'field-success');
        element.removeAttribute('aria-invalid');
        
        // Clear form group
        const formGroup = element.closest('.form-group, .field-group');
        if (formGroup) {
            formGroup.classList.remove('has-error', 'has-success');
        }
        
        // Hide error message
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }
    
    updateFormState(formConfig) {
        const { element, isValid } = formConfig;
        
        element.classList.toggle('form-valid', isValid);
        element.classList.toggle('form-invalid', !isValid);
        
        // Update submit button
        const submitBtn = element.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = !isValid;
            submitBtn.classList.toggle('btn-disabled', !isValid);
        }
    }
    
    announceError(message) {
        // Create or update live region for screen readers
        let liveRegion = Utils.$('#form-live-region');
        
        if (!liveRegion) {
            liveRegion = Utils.createElement('div', {
                id: 'form-live-region',
                className: 'sr-only',
                'aria-live': 'polite',
                'aria-atomic': 'true'
            });
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    // === FORMATTING ===
    
    formatField(fieldConfig) {
        const { element } = fieldConfig;
        const validatorFunc = this.customValidators.get(fieldConfig.type);
        
        if (validatorFunc && validatorFunc.format) {
            const formattedValue = validatorFunc.format(element.value);
            if (formattedValue !== element.value) {
                element.value = formattedValue;
            }
        }
    }
    
    updatePasswordStrength(fieldConfig) {
        const { element } = fieldConfig;
        const password = element.value;
        
        let strengthIndicator = element.parentNode.querySelector('.password-strength');
        
        if (!strengthIndicator) {
            strengthIndicator = Utils.createElement('div', {
                className: 'password-strength',
                innerHTML: `
                    <div class="strength-bar">
                        <div class="strength-fill"></div>
                    </div>
                    <div class="strength-text"></div>
                `
            });
            Utils.insertAfter(strengthIndicator, element);
        }
        
        const strength = this.calculatePasswordStrength(password);
        const strengthFill = strengthIndicator.querySelector('.strength-fill');
        const strengthText = strengthIndicator.querySelector('.strength-text');
        
        strengthFill.style.width = `${strength.score * 25}%`;
        strengthFill.className = `strength-fill strength-${strength.level}`;
        strengthText.textContent = strength.message;
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        const levels = ['weak', 'weak', 'fair', 'good', 'strong'];
        const messages = ['Слабкий', 'Слабкий', 'Середній', 'Хороший', 'Міцний'];
        
        return {
            score,
            level: levels[score] || 'weak',
            message: messages[score] || 'Слабкий',
            checks
        };
    }
    
    // === FORM SUBMISSION ===
    
    async handleFormSubmit(e, formConfig) {
        e.preventDefault();
        
        if (formConfig.isSubmitting) {
            return;
        }
        
        // Validate form
        const isValid = this.validateForm(formConfig, true);
        
        if (!isValid) {
            // Focus first invalid field
            this.focusFirstInvalidField(formConfig);
            return;
        }
        
        // Check if restaurant is open for order forms
        if (formConfig.element.classList.contains('order-form') || 
            formConfig.element.id.includes('checkout')) {
            if (!Utils.isRestaurantOpen()) {
                this.showToast(MESSAGES.errors.restaurantClosed, 'warning');
                return;
            }
        }
        
        formConfig.submissionAttempts++;
        
        try {
            await this.submitForm(formConfig);
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleSubmissionError(formConfig, error);
        }
    }
    
    async submitForm(formConfig) {
        formConfig.isSubmitting = true;
        this.updateSubmissionState(formConfig, true);
        
        const formData = this.collectFormData(formConfig);
        const endpoint = this.getFormEndpoint(formConfig);
        
        try {
            let response;
            
            if (this.isOffline) {
                // Queue for later submission
                response = await this.queueSubmission(formConfig, formData);
            } else {
                // Submit immediately
                response = await this.sendFormData(endpoint, formData, formConfig);
            }
            
            await this.handleSubmissionSuccess(formConfig, response);
            
        } finally {
            formConfig.isSubmitting = false;
            this.updateSubmissionState(formConfig, false);
        }
    }
    
    collectFormData(formConfig) {
        const data = {};
        const formData = new FormData(formConfig.element);
        
        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        // Add metadata
        data._metadata = {
            formId: formConfig.id,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            submissionAttempts: formConfig.submissionAttempts,
            validationPassed: formConfig.isValid
        };
        
        return data;
    }
    
    getFormEndpoint(formConfig) {
        const { element } = formConfig;
        
        // Check form action attribute
        if (element.action && element.action !== window.location.href) {
            return element.action;
        }
        
        // Check data attribute
        if (element.dataset.endpoint) {
            return element.dataset.endpoint;
        }
        
        // Default endpoints based on form type/ID
        if (element.id.includes('contact')) {
            return CONFIG.api.contact;
        }
        
        if (element.id.includes('order') || element.id.includes('checkout')) {
            return CONFIG.api.orders;
        }
        
        // Fallback
        return CONFIG.api.contact;
    }
    
    async sendFormData(endpoint, data, formConfig) {
        const options = {
            method: formConfig.element.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Form-ID': formConfig.id
            },
            body: JSON.stringify(data)
        };
        
        // Handle file uploads
        if (this.hasFileUploads(formConfig)) {
            const formData = new FormData(formConfig.element);
            Object.entries(data._metadata).forEach(([key, value]) => {
                formData.append(`_metadata[${key}]`, value);
            });
            
            options.headers = { 'X-Form-ID': formConfig.id };
            options.body = formData;
        }
        
        const response = await ApiUtils.request(endpoint, options);
        return response;
    }
    
    async queueSubmission(formConfig, data) {
        const submission = {
            id: Utils.generateId('submission'),
            formId: formConfig.id,
            data,
            timestamp: Date.now(),
            retries: 0
        };
        
        this.submissionQueue.push(submission);
        
        // Store in localStorage for persistence
        Utils.storage.set('form_submission_queue', this.submissionQueue);
        
        this.showToast('Форму збережено. Відправимо при появі з\'єднання.', 'info');
        
        return { success: true, queued: true };
    }
    
    async processSubmissionQueue() {
        if (this.submissionQueue.length === 0) return;
        
        const queue = [...this.submissionQueue];
        this.submissionQueue = [];
        
        for (const submission of queue) {
            try {
                const formConfig = Array.from(this.forms.values())
                    .find(config => config.id === submission.formId);
                
                if (formConfig) {
                    const endpoint = this.getFormEndpoint(formConfig);
                    await this.sendFormData(endpoint, submission.data, formConfig);
                    this.showToast('Збережену форму успішно відправлено', 'success');
                }
            } catch (error) {
                console.error('Queue submission error:', error);
                
                submission.retries++;
                if (submission.retries < 3) {
                    this.submissionQueue.push(submission);
                }
            }
        }
        
        // Update stored queue
        Utils.storage.set('form_submission_queue', this.submissionQueue);
    }
    
    async handleSubmissionSuccess(formConfig, response) {
        formConfig.hasUnsavedChanges = false;
        
        // Clear form if option is enabled
        if (formConfig.options.clearOnSubmit) {
            this.clearForm(formConfig);
        }
        
        // Show success message
        this.showSubmissionSuccess(formConfig, response);
        
        // Track analytics
        this.trackEvent(ANALYTICS_EVENTS.FORM_SUBMITTED, {
            form_id: formConfig.id,
            submission_attempts: formConfig.submissionAttempts,
            success: true
        });
        
        // Custom success handler
        const successHandler = formConfig.element.dataset.onSuccess;
        if (successHandler && window[successHandler]) {
            window[successHandler](formConfig, response);
        }
    }
    
    handleSubmissionError(formConfig, error) {
        console.error('Form submission error:', error);
        
        // Show error message
        this.showSubmissionError(formConfig, error);
        
        // Track analytics
        this.trackEvent(ANALYTICS_EVENTS.FORM_SUBMISSION_ERROR, {
            form_id: formConfig.id,
            submission_attempts: formConfig.submissionAttempts,
            error_type: error.name,
            error_message: error.message
        });
        
        // Custom error handler
        const errorHandler = formConfig.element.dataset.onError;
        if (errorHandler && window[errorHandler]) {
            window[errorHandler](formConfig, error);
        }
    }
    
    updateSubmissionState(formConfig, isSubmitting) {
        const { element } = formConfig;
        const submitBtn = element.querySelector('[type="submit"]');
        
        element.classList.toggle('form-submitting', isSubmitting);
        
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (btnText) {
                btnText.style.opacity = isSubmitting ? '0' : '1';
            }
            
            if (btnLoader) {
                btnLoader.style.display = isSubmitting ? 'block' : 'none';
            }
            
            if (isSubmitting) {
                submitBtn.classList.add('loading');
            } else {
                submitBtn.classList.remove('loading');
            }
        }
    }
    
    showSubmissionSuccess(formConfig, response) {
        const message = response.message || MESSAGES.success.messageSent;
        this.showToast(message, 'success');
        
        // Show success state on form
        formConfig.element.classList.add('submission-success');
        
        setTimeout(() => {
            formConfig.element.classList.remove('submission-success');
        }, 3000);
    }
    
    showSubmissionError(formConfig, error) {
        const message = error.message || MESSAGES.errors.network;
        this.showToast(message, 'error');
        
        // Show error state on form
        formConfig.element.classList.add('submission-error');
        
        setTimeout(() => {
            formConfig.element.classList.remove('submission-error');
        }, 3000);
    }
    
    focusFirstInvalidField(formConfig) {
        const firstInvalidField = Array.from(formConfig.fields.entries())
            .find(([element, config]) => !config.isValid);
        
        if (firstInvalidField) {
            firstInvalidField[0].focus();
            
            // Scroll into view if needed
            firstInvalidField[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    hasFileUploads(formConfig) {
        return Array.from(formConfig.fields.entries())
            .some(([element]) => element.type === 'file');
    }
    
    // === AUTO-SAVE ===
    
    setupAutoSave(formConfig) {
        const { element, options } = formConfig;
        
        const autoSaveHandler = Utils.debounce(() => {
            this.autoSaveForm(formConfig);
        }, options.autoSaveDelay);
        
        Utils.on(element, 'input', autoSaveHandler);
        Utils.on(element, 'change', autoSaveHandler);
    }
    
    autoSaveForm(formConfig) {
        const data = this.collectFormData(formConfig);
        const saveKey = `autosave_${formConfig.id}`;
        
        Utils.storage.set(saveKey, {
            data,
            timestamp: Date.now()
        });
        
        formConfig.autoSaveData = data;
        this.showAutoSaveIndicator(formConfig);
    }
    
    autoSaveAllForms() {
        this.forms.forEach((formConfig) => {
            if (formConfig.options.autoSave && formConfig.hasUnsavedChanges) {
                this.autoSaveForm(formConfig);
            }
        });
    }
    
    loadSavedData(formConfig) {
        const saveKey = `autosave_${formConfig.id}`;
        const savedData = Utils.storage.get(saveKey);
        
        if (savedData && savedData.data) {
            const timeDiff = Date.now() - savedData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (timeDiff < maxAge) {
                this.populateForm(formConfig, savedData.data);
                this.showDataRestoredMessage(formConfig);
            } else {
                // Clear old data
                Utils.storage.remove(saveKey);
            }
        }
    }
    
    populateForm(formConfig, data) {
        formConfig.fields.forEach((fieldConfig, element) => {
            const value = data[fieldConfig.name];
            if (value !== undefined && value !== null) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = Array.isArray(value) ? value.includes(element.value) : value === element.value;
                } else {
                    element.value = value;
                }
            }
        });
        
        formConfig.hasUnsavedChanges = true;
    }
    
    showAutoSaveIndicator(formConfig) {
        let indicator = formConfig.element.querySelector('.autosave-indicator');
        
        if (!indicator) {
            indicator = Utils.createElement('div', {
                className: 'autosave-indicator',
                innerHTML: '<span class="indicator-text">Збережено</span>'
            });
            formConfig.element.appendChild(indicator);
        }
        
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
    
    showDataRestoredMessage(formConfig) {
        this.showToast('Відновлено збережені дані форми', 'info');
    }
    
    // === FORM UTILITIES ===
    
    clearForm(formConfig) {
        formConfig.element.reset();
        
        // Clear custom states
        formConfig.fields.forEach((fieldConfig) => {
            this.clearFieldError(fieldConfig);
            fieldConfig.hasBeenFocused = false;
            fieldConfig.isValid = false;
        });
        
        formConfig.hasUnsavedChanges = false;
        formConfig.isValid = false;
        
        // Clear auto-saved data
        const saveKey = `autosave_${formConfig.id}`;
        Utils.storage.remove(saveKey);
        
        this.updateFormState(formConfig);
    }
    
    getFormData(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            return this.collectFormData(formConfig);
        }
        return null;
    }
    
    setFieldValue(formElement, fieldName, value) {
        const formConfig = this.forms.get(formElement);
        if (!formConfig) return false;
        
        const fieldEntry = Array.from(formConfig.fields.entries())
            .find(([element, config]) => config.name === fieldName);
        
        if (fieldEntry) {
            const [element] = fieldEntry;
            element.value = value;
            this.validateField(formConfig, fieldEntry[1]);
            return true;
        }
        
        return false;
    }
    
    getFieldValue(formElement, fieldName) {
        const formConfig = this.forms.get(formElement);
        if (!formConfig) return null;
        
        const fieldEntry = Array.from(formConfig.fields.entries())
            .find(([element, config]) => config.name === fieldName);
        
        return fieldEntry ? fieldEntry[0].value : null;
    }
    
    isFormValid(formElement) {
        const formConfig = this.forms.get(formElement);
        return formConfig ? formConfig.isValid : false;
    }
    
    validateFormManually(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            return this.validateForm(formConfig, true);
        }
        return false;
    }
    
    // === CUSTOM VALIDATORS ===
    
    addCustomValidator(name, validator) {
        this.customValidators.set(name, validator);
    }
    
    removeCustomValidator(name) {
        return this.customValidators.delete(name);
    }
    
    addFieldValidator(formElement, fieldName, validatorName, params = []) {
        const formConfig = this.forms.get(formElement);
        if (!formConfig) return false;
        
        const fieldEntry = Array.from(formConfig.fields.entries())
            .find(([element, config]) => config.name === fieldName);
        
        if (fieldEntry) {
            const fieldConfig = fieldEntry[1];
            fieldConfig.validators.push({
                type: validatorName,
                params
            });
            return true;
        }
        
        return false;
    }
    
    // === EVENT HANDLERS ===
    
    showToast(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(message, type);
        } else {
            // Fallback
            console.log(`Toast [${type}]:`, message);
        }
    }
    
    trackEvent(eventName, data = {}) {
        if (window.analytics) {
            window.analytics.track(eventName, {
                ...data,
                component: 'forms',
                timestamp: Date.now()
            });
        }
    }
    
    // === PUBLIC API ===
    
    register(formElement, options = {}) {
        return this.registerForm(formElement, options);
    }
    
    unregister(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            // Clear auto-save data
            const saveKey = `autosave_${formConfig.id}`;
            Utils.storage.remove(saveKey);
            
            // Remove from forms map
            this.forms.delete(formElement);
            
            return true;
        }
        return false;
    }
    
    reset(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            this.clearForm(formConfig);
            return true;
        }
        return false;
    }
    
    submit(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            const submitEvent = new Event('submit', { cancelable: true });
            return formConfig.element.dispatchEvent(submitEvent);
        }
        return false;
    }
    
    getFormState(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig) {
            return {
                id: formConfig.id,
                isValid: formConfig.isValid,
                isSubmitting: formConfig.isSubmitting,
                hasUnsavedChanges: formConfig.hasUnsavedChanges,
                submissionAttempts: formConfig.submissionAttempts,
                fieldCount: formConfig.fields.size,
                lastValidation: formConfig.lastValidation
            };
        }
        return null;
    }
    
    getAllForms() {
        return Array.from(this.forms.entries()).map(([element, config]) => ({
            element,
            id: config.id,
            isValid: config.isValid,
            hasUnsavedChanges: config.hasUnsavedChanges
        }));
    }
    
    getValidationErrors(formElement) {
        const formConfig = this.forms.get(formElement);
        if (formConfig && formConfig.lastValidation) {
            return formConfig.lastValidation.errors;
        }
        return [];
    }
    
    // === FORM BUILDER HELPERS ===
    
    createField(type, options = {}) {
        const fieldConfig = {
            type: type,
            name: options.name || Utils.generateId('field'),
            label: options.label || '',
            placeholder: options.placeholder || '',
            required: options.required || false,
            validators: options.validators || [],
            className: options.className || '',
            attributes: options.attributes || {}
        };
        
        const wrapper = Utils.createElement('div', {
            className: 'form-group'
        });
        
        // Create label
        if (fieldConfig.label) {
            const label = Utils.createElement('label', {
                className: 'form-label',
                textContent: fieldConfig.label,
                for: fieldConfig.name
            });
            if (fieldConfig.required) {
                label.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(label);
        }
        
        // Create input
        const input = Utils.createElement('input', {
            type: fieldConfig.type,
            name: fieldConfig.name,
            id: fieldConfig.name,
            className: `form-input ${fieldConfig.className}`,
            placeholder: fieldConfig.placeholder,
            ...fieldConfig.attributes
        });
        
        if (fieldConfig.required) {
            input.setAttribute('required', 'true');
        }
        
        wrapper.appendChild(input);
        
        return wrapper;
    }
    
    createSelect(options = {}) {
        const selectConfig = {
            name: options.name || Utils.generateId('select'),
            label: options.label || '',
            required: options.required || false,
            options: options.options || [],
            className: options.className || ''
        };
        
        const wrapper = Utils.createElement('div', {
            className: 'form-group'
        });
        
        // Create label
        if (selectConfig.label) {
            const label = Utils.createElement('label', {
                className: 'form-label',
                textContent: selectConfig.label,
                for: selectConfig.name
            });
            if (selectConfig.required) {
                label.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(label);
        }
        
        // Create select
        const select = Utils.createElement('select', {
            name: selectConfig.name,
            id: selectConfig.name,
            className: `form-select ${selectConfig.className}`
        });
        
        if (selectConfig.required) {
            select.setAttribute('required', 'true');
        }
        
        // Add options
        selectConfig.options.forEach(option => {
            const optElement = Utils.createElement('option', {
                value: option.value || option,
                textContent: option.text || option
            });
            select.appendChild(optElement);
        });
        
        wrapper.appendChild(select);
        
        return wrapper;
    }
    
    createTextarea(options = {}) {
        const textareaConfig = {
            name: options.name || Utils.generateId('textarea'),
            label: options.label || '',
            placeholder: options.placeholder || '',
            required: options.required || false,
            rows: options.rows || 4,
            className: options.className || ''
        };
        
        const wrapper = Utils.createElement('div', {
            className: 'form-group'
        });
        
        // Create label
        if (textareaConfig.label) {
            const label = Utils.createElement('label', {
                className: 'form-label',
                textContent: textareaConfig.label,
                for: textareaConfig.name
            });
            if (textareaConfig.required) {
                label.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(label);
        }
        
        // Create textarea
        const textarea = Utils.createElement('textarea', {
            name: textareaConfig.name,
            id: textareaConfig.name,
            className: `form-textarea ${textareaConfig.className}`,
            placeholder: textareaConfig.placeholder,
            rows: textareaConfig.rows
        });
        
        if (textareaConfig.required) {
            textarea.setAttribute('required', 'true');
        }
        
        wrapper.appendChild(textarea);
        
        return wrapper;
    }
    
    // === CLEANUP ===
    
    destroy() {
        // Clear all forms
        this.forms.clear();
        
        // Clear validators
        this.customValidators.clear();
        
        // Clear submission queue
        this.submissionQueue = [];
        
        // Remove event listeners
        window.removeEventListener('online', this.processSubmissionQueue);
        window.removeEventListener('offline', () => this.isOffline = true);
        
        console.log('📝 Form Manager destroyed');
    }
    
    // === DEBUG ===
    
    debug() {
        if (!CONFIG.isDevelopment) return;
        
        console.group('📝 Form Manager Debug Info');
        console.log('Registered forms:', this.forms.size);
        console.log('Custom validators:', Array.from(this.customValidators.keys()));
        console.log('Submission queue:', this.submissionQueue.length);
        console.log('Is offline:', this.isOffline);
        
        this.forms.forEach((config, element) => {
            console.log(`Form ${config.id}:`, {
                isValid: config.isValid,
                hasUnsavedChanges: config.hasUnsavedChanges,
                fieldsCount: config.fields.size,
                submissionAttempts: config.submissionAttempts
            });
        });
        
        console.groupEnd();
    }
}

// Form utility functions
export class FormUtils {
    /**
     * Create a complete contact form
     */
    static createContactForm(container, options = {}) {
        const form = Utils.createElement('form', {
            className: 'contact-form',
            id: 'contact-form',
            innerHTML: `
                <div class="form-group">
                    <label for="contact-name" class="form-label">Ім'я *</label>
                    <input type="text" id="contact-name" name="name" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="contact-phone" class="form-label">Телефон *</label>
                    <input type="tel" id="contact-phone" name="phone" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="contact-email" class="form-label">Email</label>
                    <input type="email" id="contact-email" name="email" class="form-input">
                </div>
                
                <div class="form-group">
                    <label for="contact-message" class="form-label">Повідомлення *</label>
                    <textarea id="contact-message" name="message" class="form-textarea" rows="5" required></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn cta-primary">
                        <span class="btn-text">Відправити</span>
                        <span class="btn-loader"></span>
                    </button>
                </div>
            `
        });
        
        container.appendChild(form);
        return form;
    }
    
    /**
     * Create a newsletter subscription form
     */
    static createNewsletterForm(container) {
        const form = Utils.createElement('form', {
            className: 'newsletter-form',
            id: 'newsletter-form',
            innerHTML: `
                <div class="form-group inline">
                    <label for="newsletter-email" class="sr-only">Email для розсилки</label>
                    <input type="email" 
                           id="newsletter-email" 
                           name="email" 
                           class="form-input" 
                           placeholder="Ваш email"
                           required>
                    <button type="submit" class="btn cta-primary">
                        <span class="btn-text">Підписатися</span>
                        <span class="btn-loader"></span>
                    </button>
                </div>
            `
        });
        
        container.appendChild(form);
        return form;
    }
    
    /**
     * Validate Ukrainian phone number
     */
    static validateUkrainianPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        // Ukrainian mobile formats: +380XXXXXXXXX
        const ukrainianMobile = /^380(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\d{7}$/;
        
        return ukrainianMobile.test(cleaned);
    }
    
    /**
     * Format Ukrainian phone number
     */
    static formatUkrainianPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length >= 10) {
            const formatted = cleaned.startsWith('380') ? cleaned : '380' + cleaned.slice(-9);
            return `+38 (${formatted.slice(2, 5)}) ${formatted.slice(5, 8)}-${formatted.slice(8, 10)}-${formatted.slice(10, 12)}`;
        }
        
        return phone;
    }
}

export default FormManager;