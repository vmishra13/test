/**
 * User status constants matching database values
 */
export enum UserStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  SUSPENDED = -1,
  DELETED = -99,
}

/**
 * Client status constants
 */
export enum ClientStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  SUSPENDED = -1,
  DELETED = -99,
}

/**
 * Password status constants
 */
export enum PasswordStatus {
  ACTIVE = 1,
  EXPIRED = 0,
  DISABLED = -1,
}

/**
 * Status utility functions
 */
export const StatusUtils = {
  user: {
    isActive: (status: number | null) => status === UserStatus.ACTIVE,
    isInactive: (status: number | null) => status === UserStatus.INACTIVE,
    isSuspended: (status: number | null) => status === UserStatus.SUSPENDED,
    isDeleted: (status: number | null) => status === UserStatus.DELETED,
    isValid: (status: number | null) => status !== null && status > UserStatus.DELETED,
  },
  client: {
    isActive: (status: number | null) => status === ClientStatus.ACTIVE,
    isInactive: (status: number | null) => status === ClientStatus.INACTIVE,
    isSuspended: (status: number | null) => status === ClientStatus.SUSPENDED,
    isDeleted: (status: number | null) => status === ClientStatus.DELETED,
  },
  password: {
    isActive: (status: number | null) => status === PasswordStatus.ACTIVE,
    isExpired: (status: number | null) => status === PasswordStatus.EXPIRED,
    isDisabled: (status: number | null) => status === PasswordStatus.DISABLED,
  },
} as const;
