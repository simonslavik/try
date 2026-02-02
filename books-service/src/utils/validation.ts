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


export const addBookForBookClubSchema = joi.object({
    googleBooksId: joi.string().required().messages({
        'any.required': 'Google Books ID is required'
    }),
    status: joi.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed'
    }),
    startDate: joi.date().optional().messages({
        'date.base': 'Start date must be a valid date'
    }),
    endDate: joi.date().optional().messages({
        'date.base': 'End date must be a valid date'
    })
});

export const updateBookClubBookSchema = joi.object({
    status: joi.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed'
    }),
    startDate: joi.date().optional().messages({
        'date.base': 'Start date must be a valid date'
    }),
    endDate: joi.date().optional().messages({
        'date.base': 'End date must be a valid date'
    })
});


export const postsBookProgressSchema = joi.object({
    pagesRead: joi.number().min(0).required().messages({
        'number.base': 'Pages read must be a number',
        'number.min': 'Pages read cannot be negative',
        'any.required': 'Pages read is required'
    }),
    notes: joi.string().max(2000).optional().messages({
        'string.max': 'Notes cannot exceed 2000 characters'
    })
});

// Param validation schemas
export const bookClubIdParamSchema = joi.object({
    bookClubId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubId format',
        'any.required': 'bookClubId is required'
    })
});

export const bookIdParamSchema = joi.object({
    bookId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid bookId format',
        'any.required': 'bookId is required'
    })
});

export const bookClubBookIdParamSchema = joi.object({
    bookClubBookId: joi.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubBookId format',
        'any.required': 'bookClubBookId is required'
    })
});

export const googleBooksIdParamSchema = joi.object({
    googleBooksId: joi.string().required().messages({
        'any.required': 'googleBooksId is required'
    })
}); 

export const bookClubBookReviewSchema = joi.object({
    rating: joi.number().min(1).max(5).required().messages({
        'any.required': 'Rating is required',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5'
    }),
    reviewText: joi.string().max(2000).optional().allow('').messages({
        'string.max': 'Review cannot exceed 2000 characters'
    })
});
