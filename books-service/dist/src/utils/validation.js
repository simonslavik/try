"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookClubBookReviewSchema = exports.googleBooksIdParamSchema = exports.bookClubBookIdParamSchema = exports.bookIdParamSchema = exports.bookClubIdParamSchema = exports.postsBookProgressSchema = exports.updateBookClubBookSchema = exports.addBookForBookClubSchema = exports.updateBookSchema = exports.addBookSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.addBookSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'Google Books ID is required',
    }),
    status: joi_1.default
        .string()
        .valid('favorite', 'reading', 'want_to_read', 'completed')
        .required()
        .messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
        'any.required': 'Status is required',
    }),
    rating: joi_1.default.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    review: joi_1.default.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters',
    }),
});
exports.updateBookSchema = joi_1.default.object({
    status: joi_1.default
        .string()
        .valid('favorite', 'reading', 'want_to_read', 'completed')
        .optional()
        .messages({
        'any.only': 'Status must be one of: favorite, reading, want_to_read, completed',
    }),
    rating: joi_1.default.number().min(1).max(5).optional().messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    review: joi_1.default.string().max(1000).optional().messages({
        'string.max': 'Review cannot exceed 1000 characters',
    }),
});
exports.addBookForBookClubSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'Google Books ID is required',
    }),
    status: joi_1.default.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed',
    }),
    startDate: joi_1.default.date().optional().messages({
        'date.base': 'Start date must be a valid date',
    }),
    endDate: joi_1.default.date().optional().messages({
        'date.base': 'End date must be a valid date',
    }),
});
exports.updateBookClubBookSchema = joi_1.default.object({
    status: joi_1.default.string().valid('current', 'upcoming', 'completed').optional().messages({
        'any.only': 'Status must be one of: current, upcoming, completed',
    }),
    startDate: joi_1.default.date().optional().messages({
        'date.base': 'Start date must be a valid date',
    }),
    endDate: joi_1.default.date().optional().messages({
        'date.base': 'End date must be a valid date',
    }),
});
exports.postsBookProgressSchema = joi_1.default.object({
    pagesRead: joi_1.default.number().min(0).required().messages({
        'number.base': 'Pages read must be a number',
        'number.min': 'Pages read cannot be negative',
        'any.required': 'Pages read is required',
    }),
    notes: joi_1.default.string().max(2000).optional().messages({
        'string.max': 'Notes cannot exceed 2000 characters',
    }),
});
// Param validation schemas
exports.bookClubIdParamSchema = joi_1.default.object({
    bookClubId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubId format',
        'any.required': 'bookClubId is required',
    }),
});
exports.bookIdParamSchema = joi_1.default.object({
    bookId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookId format',
        'any.required': 'bookId is required',
    }),
});
exports.bookClubBookIdParamSchema = joi_1.default.object({
    bookClubBookId: joi_1.default.string().uuid().required().messages({
        'string.guid': 'Invalid bookClubBookId format',
        'any.required': 'bookClubBookId is required',
    }),
});
exports.googleBooksIdParamSchema = joi_1.default.object({
    googleBooksId: joi_1.default.string().required().messages({
        'any.required': 'googleBooksId is required',
    }),
});
exports.bookClubBookReviewSchema = joi_1.default.object({
    rating: joi_1.default.number().min(1).max(5).required().messages({
        'any.required': 'Rating is required',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
    }),
    reviewText: joi_1.default.string().max(2000).optional().allow('').messages({
        'string.max': 'Review cannot exceed 2000 characters',
    }),
});
