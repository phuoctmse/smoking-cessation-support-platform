export const RoleName = {
    Member: 'MEMBER',
    Coach: 'COACH',
    Admin: 'ADMIN',
} as const

export const Status = {
    Active: 'ACTIVE',
    Inactive: 'INACTIVE',
    Blocked: 'BLOCKED',
} as const 

export type RoleNameType = typeof RoleName[keyof typeof RoleName]
export type StatusType = typeof Status[keyof typeof Status]
