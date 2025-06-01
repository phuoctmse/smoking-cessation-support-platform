import { registerEnumType } from '@nestjs/graphql';
import { CessationPlanStatus } from '@prisma/client';

registerEnumType(CessationPlanStatus, {
  name: 'CessationPlanStatus',
  description: 'The status of a cessation plan',
  valuesMap: {
    PLANNING: {
      description: 'Plan is being created',
    },
    ACTIVE: {
      description: 'Plan is currently active',
    },
    PAUSED: {
      description: 'Plan is temporarily paused',
    },
    COMPLETED: {
      description: 'Plan has been completed',
    },
    CANCELLED: {
      description: 'Plan has been cancelled',
    },
  },
});