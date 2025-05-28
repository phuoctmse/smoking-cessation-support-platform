export const CESSATION_PLAN_TEMPLATE_MESSAGES = {
  TEMPLATE_NOT_FOUND: 'Cessation plan template not found',
  TEMPLATE_CREATED: 'Cessation plan template created successfully',
  TEMPLATE_UPDATED: 'Cessation plan template updated successfully',
  TEMPLATE_DELETED: 'Cessation plan template deleted successfully',
  TEMPLATE_NAME_EXISTS: 'Template name already exists',
  INVALID_DIFFICULTY_LEVEL: 'Invalid difficulty level',
  INVALID_DURATION: 'Duration must be greater than 0',
} as const;

export const CESSATION_PLAN_TEMPLATE_CACHE_TTL = 300;
export const CESSATION_PLAN_TEMPLATE_CACHE_PREFIX = 'cessation_template:';