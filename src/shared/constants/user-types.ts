/**
 * User types based on your user_type table
 * These should match the records in your database
 */
export enum UserType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  CLINICAL_USER = 'CLINICAL_USER',
  OFFICE_USER = 'OFFICE_USER',
  PATIENT_USER = 'PATIENT_USER',
}

/**
 * User type utility functions
 */
export const UserTypeUtils = {
  /**
   * Check if user type can register other users
   */
  canRegisterUsers: (userType: string): boolean => {
    return [UserType.SYSTEM_ADMIN, UserType.CLIENT_ADMIN].includes(userType as UserType);
  },

  /**
   * Get user types that can be created by this user type
   */
  getCreatableUserTypes: (userType: string): UserType[] => {
    switch (userType) {
      case UserType.SYSTEM_ADMIN:
        return [
          UserType.CLIENT_ADMIN,
          UserType.CLINICAL_USER,
          UserType.OFFICE_USER,
          UserType.PATIENT_USER,
        ];
      case UserType.CLIENT_ADMIN:
        return [UserType.CLINICAL_USER, UserType.OFFICE_USER, UserType.PATIENT_USER];
      default:
        return [];
    }
  },
} as const;
