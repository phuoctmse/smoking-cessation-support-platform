import { registerEnumType } from '@nestjs/graphql'
import { CessationPlanStatus, PlanStageStatus } from '@prisma/client'
import { RoleName, Status } from '../constants/role.constant'

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
})

registerEnumType(PlanStageStatus, {
  name: 'PlanStageStatus',
  description: 'The status of a plan stage',
  valuesMap: {
    PENDING: {
      description: 'Stage is pending',
    },
    ACTIVE: {
      description: 'Stage is currently active',
    },
    COMPLETED: {
      description: 'Stage has been completed',
    },
    SKIPPED: {
      description: 'Stage has been skipped',
    },
  },
})

export enum RoleNameEnum {
  MEMBER = 'MEMBER',
  COACH = 'COACH',
  ADMIN = 'ADMIN',
}

export enum StatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

registerEnumType(RoleNameEnum, {
  name: 'RoleNameEnum',
  description: 'The role of the user',
})

registerEnumType(StatusEnum, {
  name: 'StatusEnum',
  description: 'The status of the user',
})