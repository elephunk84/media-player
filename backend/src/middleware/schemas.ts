/**
 * Common Joi Validation Schemas
 *
 * Reusable Joi schemas for validating request data across the application.
 */

import Joi from 'joi';

// ==================== Common Field Schemas ====================

/**
 * Schema for positive integer ID
 */
export const idSchema = Joi.number().integer().positive().required().messages({
  'number.base': 'ID must be a number',
  'number.integer': 'ID must be an integer',
  'number.positive': 'ID must be positive',
  'any.required': 'ID is required',
});

/**
 * Schema for video title
 */
export const videoTitleSchema = Joi.string().trim().min(1).max(255).messages({
  'string.empty': 'Title cannot be empty',
  'string.max': 'Title cannot exceed 255 characters',
});

/**
 * Schema for video description
 */
export const videoDescriptionSchema = Joi.string().trim().max(10000).allow(null, '').messages({
  'string.max': 'Description cannot exceed 10000 characters',
});

/**
 * Schema for tags array
 */
export const tagsSchema = Joi.array()
  .items(Joi.string().trim().min(1).max(50).lowercase())
  .unique()
  .messages({
    'array.base': 'Tags must be an array',
    'string.empty': 'Tag cannot be empty',
    'string.max': 'Tag cannot exceed 50 characters',
    'array.unique': 'Tags must be unique',
  });

/**
 * Schema for custom metadata object
 */
export const customMetadataSchema = Joi.object().unknown(true).max(100).messages({
  'object.base': 'Custom metadata must be an object',
  'object.max': 'Custom metadata cannot exceed 100 properties',
});

/**
 * Schema for duration in seconds
 */
export const durationSchema = Joi.number().min(0).messages({
  'number.base': 'Duration must be a number',
  'number.min': 'Duration cannot be negative',
});

/**
 * Schema for file size in bytes
 */
export const fileSizeSchema = Joi.number().integer().min(0).messages({
  'number.base': 'File size must be a number',
  'number.integer': 'File size must be an integer',
  'number.min': 'File size cannot be negative',
});

/**
 * Schema for video resolution
 */
export const resolutionSchema = Joi.string().trim().max(20).messages({
  'string.max': 'Resolution cannot exceed 20 characters',
});

/**
 * Schema for video codec
 */
export const codecSchema = Joi.string().trim().max(50).messages({
  'string.max': 'Codec cannot exceed 50 characters',
});

// ==================== Video Schemas ====================

/**
 * Schema for creating a video
 */
export const createVideoSchema = Joi.object({
  filePath: Joi.string().trim().min(1).required().messages({
    'string.empty': 'File path cannot be empty',
    'any.required': 'File path is required',
  }),
  title: videoTitleSchema.required().messages({
    'any.required': 'Title is required',
  }),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional().default([]),
  duration: durationSchema.optional().default(0),
  resolution: resolutionSchema.optional().default('unknown'),
  codec: codecSchema.optional(),
  fileSize: fileSizeSchema.optional(),
  customMetadata: customMetadataSchema.optional().default({}),
});

/**
 * Schema for updating video metadata
 */
export const updateVideoSchema = Joi.object({
  title: videoTitleSchema.optional(),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional(),
  duration: durationSchema.optional(),
  resolution: resolutionSchema.optional(),
  codec: codecSchema.optional(),
  customMetadata: customMetadataSchema.optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Schema for video search criteria
 */
export const videoSearchSchema = Joi.object({
  query: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Search query cannot exceed 500 characters',
  }),
  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim()),
      Joi.string()
        .trim()
        .custom((value: string) => value.split(',').map((tag: string) => tag.trim()))
    )
    .optional(),
  minDuration: durationSchema.optional(),
  maxDuration: durationSchema.optional(),
  resolution: resolutionSchema.optional(),
  includeUnavailable: Joi.boolean().optional().default(false),
  limit: Joi.number().integer().min(1).max(1000).optional().default(100).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 1000',
  }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.min': 'Offset cannot be negative',
  }),
});

/**
 * Schema for scan videos request
 */
export const scanVideosSchema = Joi.object({
  mountPath: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Mount path cannot be empty',
    'any.required': 'Mount path is required',
  }),
});

// ==================== Clip Schemas ====================

/**
 * Schema for creating a clip
 */
export const createClipSchema = Joi.object({
  videoId: idSchema.messages({
    'any.required': 'Video ID is required',
  }),
  title: videoTitleSchema.required().messages({
    'any.required': 'Clip title is required',
  }),
  startTime: Joi.number().min(0).required().messages({
    'number.base': 'Start time must be a number',
    'number.min': 'Start time cannot be negative',
    'any.required': 'Start time is required',
  }),
  endTime: Joi.number().min(0).required().messages({
    'number.base': 'End time must be a number',
    'number.min': 'End time cannot be negative',
    'any.required': 'End time is required',
  }),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional().default([]),
  customMetadata: customMetadataSchema.optional().default({}),
}).custom((value: { startTime: number; endTime: number }, helpers) => {
  // Validate that startTime < endTime
  if (value.startTime >= value.endTime) {
    return helpers.error('any.invalid', {
      message: 'Start time must be less than end time',
    });
  }
  return value;
});

/**
 * Schema for updating clip metadata
 */
export const updateClipSchema = Joi.object({
  title: videoTitleSchema.optional(),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional(),
  customMetadata: customMetadataSchema.optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Schema for getting clips by video
 */
export const getClipsByVideoSchema = Joi.object({
  videoId: idSchema,
  includeOrphaned: Joi.boolean().optional().default(false),
});

// ==================== Playlist Schemas ====================

/**
 * Schema for creating a playlist
 */
export const createPlaylistSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Playlist name cannot be empty',
    'string.max': 'Playlist name cannot exceed 255 characters',
    'any.required': 'Playlist name is required',
  }),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional().default([]),
});

/**
 * Schema for updating a playlist
 */
export const updatePlaylistSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Playlist name cannot be empty',
    'string.max': 'Playlist name cannot exceed 255 characters',
  }),
  description: videoDescriptionSchema.optional(),
  tags: tagsSchema.optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Schema for adding a clip to a playlist
 */
export const addClipToPlaylistSchema = Joi.object({
  clipId: idSchema.messages({
    'any.required': 'Clip ID is required',
  }),
  order: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.min': 'Order cannot be negative',
  }),
});

/**
 * Schema for removing a clip from a playlist
 */
export const removeClipFromPlaylistSchema = Joi.object({
  clipId: idSchema.messages({
    'any.required': 'Clip ID is required',
  }),
  reorder: Joi.boolean().optional().default(true),
});

/**
 * Schema for reordering playlist clips
 */
export const reorderPlaylistSchema = Joi.object({
  clipOrders: Joi.array()
    .items(
      Joi.object({
        clipId: idSchema.messages({
          'any.required': 'Clip ID is required in clipOrders',
        }),
        order: Joi.number().integer().min(0).required().messages({
          'number.base': 'Order must be a number',
          'number.integer': 'Order must be an integer',
          'number.min': 'Order cannot be negative',
          'any.required': 'Order is required in clipOrders',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Clip orders must be an array',
      'array.min': 'At least one clip order must be provided',
      'any.required': 'Clip orders are required',
    }),
});

// ==================== Authentication Schemas ====================

/**
 * Schema for user registration
 */
export const registerUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.empty': 'Username cannot be empty',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

/**
 * Schema for user login
 */
export const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': 'Username cannot be empty',
    'any.required': 'Username is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Current password cannot be empty',
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

// ==================== Common Parameter Schemas ====================

/**
 * Schema for ID route parameter
 */
export const idParamSchema = Joi.object({
  id: idSchema,
});

/**
 * Schema for pagination query parameters
 */
export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(1000).optional().default(100).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 1000',
  }),
  offset: Joi.number().integer().min(0).optional().default(0).messages({
    'number.min': 'Offset cannot be negative',
  }),
});

/**
 * Schema for sort query parameters
 */
export const sortSchema = Joi.object({
  sortBy: Joi.string()
    .trim()
    .valid('createdAt', 'updatedAt', 'title', 'duration', 'fileSize')
    .optional()
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, updatedAt, title, duration, fileSize',
    }),
  sortOrder: Joi.string().trim().valid('asc', 'desc').optional().default('desc').messages({
    'any.only': 'Sort order must be either asc or desc',
  }),
});
