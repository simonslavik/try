import joi from 'joi';

// ============================================
// JOI VALIDATION EXAMPLES & REFERENCE
// ============================================

// 1. STRING VALIDATION
export const stringExamples = joi.object({
    // Basic string
    username: joi.string(),
    
    // String with length constraints
    name: joi.string().min(3).max(50),
    
    // Trim whitespace
    trimmedName: joi.string().trim(),
    
    // Case conversion
    lowercaseEmail: joi.string().lowercase(),
    uppercaseCode: joi.string().uppercase(),
    
    // Email validation
    email: joi.string().email(),
    
    // Pattern matching (regex)
    phoneNumber: joi.string().pattern(/^[0-9]{10}$/),
    
    // Alphanumeric only
    alphanumeric: joi.string().alphanum(),
    
    // UUID validation
    userId: joi.string().uuid(),
    
    // Required field
    requiredField: joi.string().required(),
    
    // Optional field with default
    status: joi.string().default('active')
});

// 2. NUMBER VALIDATION
export const numberExamples = joi.object({
    // Basic number
    age: joi.number(),
    
    // Integer only
    count: joi.number().integer(),
    
    // Min/max values
    price: joi.number().min(0).max(10000),
    
    // Positive/negative
    positiveNumber: joi.number().positive(),
    negativeNumber: joi.number().negative(),
    
    // Multiple of (e.g., multiples of 5)
    quantity: joi.number().multiple(5),
    
    // Precision (decimal places)
    rating: joi.number().precision(2)  // e.g., 4.25
});

// 3. BOOLEAN VALIDATION
export const booleanExamples = joi.object({
    isActive: joi.boolean(),
    
    // Convert strings "true"/"false" to boolean
    acceptTerms: joi.boolean().truthy('yes').falsy('no')
});

// 4. DATE VALIDATION
export const dateExamples = joi.object({
    // ISO date string
    createdAt: joi.date().iso(),
    
    // Must be greater than now
    futureDate: joi.date().greater('now'),
    
    // Must be less than now
    birthDate: joi.date().less('now'),
    
    // Min/max dates
    appointmentDate: joi.date().min('2024-01-01').max('2025-12-31')
});

// 5. ARRAY VALIDATION
export const arrayExamples = joi.object({
    // Array of strings
    tags: joi.array().items(joi.string()),
    
    // Array with min/max length
    skills: joi.array().items(joi.string()).min(1).max(10),
    
    // Unique items only
    uniqueEmails: joi.array().items(joi.string().email()).unique(),
    
    // Array of specific values
    categories: joi.array().items(joi.string().valid('tech', 'business', 'health')),
    
    // Array of objects
    addresses: joi.array().items(
        joi.object({
            street: joi.string().required(),
            city: joi.string().required(),
            zipCode: joi.string().pattern(/^[0-9]{5}$/)
        })
    )
});

// 6. OBJECT VALIDATION
export const objectExamples = joi.object({
    // Nested object
    address: joi.object({
        street: joi.string(),
        city: joi.string(),
        country: joi.string()
    }),
    
    // Object with unknown keys allowed
    metadata: joi.object().unknown(true),
    
    // Object with at least one key required
    settings: joi.object().min(1)
});

// 7. CONDITIONAL VALIDATION
export const conditionalExample = joi.object({
    accountType: joi.string().valid('personal', 'business').required(),
    
    // If accountType is 'business', companyName is required
    companyName: joi.string().when('accountType', {
        is: 'business',
        then: joi.required(),
        otherwise: joi.optional()
    }),
    
    // If accountType is 'business', taxId is required
    taxId: joi.string().when('accountType', {
        is: 'business',
        then: joi.required()
    })
});

// 8. ALTERNATIVES (OR logic)
export const alternativeExample = joi.object({
    // Either email OR phone must be provided
    contact: joi.alternatives().try(
        joi.object({
            email: joi.string().email().required()
        }),
        joi.object({
            phone: joi.string().pattern(/^[0-9]{10}$/).required()
        })
    )
});

// 9. CUSTOM VALIDATION
export const customValidation = joi.object({
    password: joi.string()
        .min(8)
        .custom((value, helpers) => {
            // Custom validation logic
            if (value.includes('password')) {
                return helpers.error('password.common');
            }
            return value;
        })
        .messages({
            'password.common': 'Password cannot contain the word "password"'
        })
});

// 10. REFERENCES (Compare fields)
export const referenceExample = joi.object({
    password: joi.string().min(8).required(),
    
    // confirmPassword must match password
    confirmPassword: joi.string()
        .valid(joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match'
        })
});

// 11. ALL VALIDATION OPTIONS IN ONE SCHEMA
export const comprehensiveUserSchema = joi.object({
    // Personal info
    firstName: joi.string().min(2).max(50).trim().required().messages({
        'string.min': 'First name must be at least 2 characters',
        'any.required': 'First name is required'
    }),
    
    lastName: joi.string().min(2).max(50).trim().required(),
    
    email: joi.string().email().lowercase().trim().required(),
    
    password: joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
        .required(),
    
    confirmPassword: joi.string()
        .valid(joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords must match'
        }),
    
    // Age validation
    age: joi.number().integer().min(18).max(120).required(),
    
    // Phone with custom pattern
    phone: joi.string().pattern(/^\+?[1-9]\d{9,14}$/).messages({
        'string.pattern.base': 'Please provide a valid phone number'
    }),
    
    // Role with enum
    role: joi.string().valid('CUSTOMER', 'SELLER', 'ADMIN').default('CUSTOMER'),
    
    // Optional bio
    bio: joi.string().max(500).allow('', null),
    
    // Array of interests
    interests: joi.array().items(joi.string()).min(1).max(10),
    
    // Accept terms
    acceptTerms: joi.boolean().valid(true).required().messages({
        'any.only': 'You must accept the terms and conditions'
    }),
    
    // Optional marketing consent
    marketingConsent: joi.boolean().default(false)
});

// ============================================
// HOW TO USE IN YOUR CONTROLLER
// ============================================

/* 
Example usage:

import { comprehensiveUserSchema } from '../utils/joi-examples.js';

export const register = async (req, res) => {
    // Validate request body
    const { error, value } = comprehensiveUserSchema.validate(req.body, {
        abortEarly: false  // Return all errors, not just first one
    });
    
    if (error) {
        // Extract all error messages
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }
    
    // Use validated & cleaned data
    const { email, password, firstName, lastName, role } = value;
    
    // Continue with your logic...
};
*/

// ============================================
// VALIDATION OPTIONS
// ============================================

export const validationOptions = {
    // Stop on first error (default: true)
    abortEarly: false,
    
    // Remove unknown keys from object (default: false)
    stripUnknown: true,
    
    // Allow unknown keys (default: false)
    allowUnknown: false,
    
    // Convert types if possible, e.g., "123" -> 123 (default: true)
    convert: true
};

/* 
Usage with options:

const { error, value } = schema.validate(data, {
    abortEarly: false,      // Get all errors
    stripUnknown: true      // Remove extra fields
});
*/
