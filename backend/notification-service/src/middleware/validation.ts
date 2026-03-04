import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation schemas for notification-service endpoints
 */

export const schemas = {
  // GET /notifications query params
  getNotifications: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),

  // PATCH /notifications/:id/read
  notificationId: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // PUT /notifications/preferences
  updatePreferences: Joi.object({
    emailEnabled: Joi.boolean(),
    meetingCreated: Joi.boolean(),
    meetingUpdated: Joi.boolean(),
    meetingCancelled: Joi.boolean(),
    meetingReminder24h: Joi.boolean(),
    meetingReminder1h: Joi.boolean(),
    meetingStarting: Joi.boolean(),
  }).min(1).messages({
    'object.min': 'At least one preference must be provided',
  }),

  // POST /notifications/internal/meeting
  meetingEvent: Joi.object({
    type: Joi.string()
      .valid('meeting_created', 'meeting_updated', 'meeting_cancelled')
      .required(),
    clubId: Joi.string().uuid().required(),
    meetingId: Joi.string().uuid().required(),
    meetingTitle: Joi.string().max(255).allow('', null),
    scheduledAt: Joi.string().isoDate().allow(null),
    userIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    excludeUserId: Joi.string().uuid().allow(null),
    clubName: Joi.string().max(255).allow('', null),
  }),
};

/**
 * Validation middleware factory
 * @param schema - Joi schema to validate against
 * @param source - 'body' | 'query' | 'params'
 */
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: details,
      });
    }

    // Replace with sanitized values
    req[source] = value;
    next();
  };
};
