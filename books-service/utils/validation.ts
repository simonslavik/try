import joi from 'joi';

export const addBookSchema = joi.object({
    googleBooksId: joi.string().required().messages({
        'any.required': 'Google Books ID is required'
    }),
    status: joi.string().valid('favorite', 'reading', 'want_to_read', 'completed').required().messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
        'any.required': 'Status is required'
    }),
    rating: joi.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
    }),
    review: joi.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters'
    })
});

export const updateBookSchema = joi.object({
    status: joi.string().valid('favorite', 'reading', 'want_to_read', 'completed').optional().messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed'
    }),
    rating: joi.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
    }),
    review: joi.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters'
    })
});