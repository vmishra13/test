/**
 * Core healthcare roles for ReliaCare system
 * These match exactly with the role table in database
 */
export enum CoreRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  CLINICAL_STAFF = 'CLINICAL_STAFF',
  OFFICE_STAFF = 'OFFICE_STAFF',
  PATIENT = 'PATIENT',
  NA = 'NA', // Special role for generic access checks
}

/**
 * Role hierarchy levels for permission checking
 */
// First, define the interface for role configuration
interface RoleConfig {
  level: number;
  description: string;
  canCreate: CoreRole[];
  canManage: 'all_clients' | 'same_client_only' | 'self_only';
  permissions: string[];
}

// Define ROLE_HIERARCHY with explicit typing (remove `as const`)
export const ROLE_HIERARCHY: Record<CoreRole, RoleConfig> = {
  [CoreRole.SUPER_ADMIN]: {
    level: 10,
    description: 'System administrator with full access',
    canCreate: [
      CoreRole.CLIENT_ADMIN,
      CoreRole.CLINICAL_STAFF,
      CoreRole.OFFICE_STAFF,
      CoreRole.PATIENT,
    ],
    canManage: 'all_clients',
    permissions: ['*'],
  },
  [CoreRole.CLIENT_ADMIN]: {
    level: 8,
    description: 'Organization administrator with full client access',
    canCreate: [CoreRole.CLINICAL_STAFF, CoreRole.OFFICE_STAFF, CoreRole.PATIENT],
    canManage: 'same_client_only',
    permissions: ['client_admin', 'user_management', 'billing', 'reports'],
  },
  [CoreRole.CLINICAL_STAFF]: {
    level: 5,
    description: 'Healthcare providers including doctors, nurses, and therapists',
    canCreate: [CoreRole.PATIENT],
    canManage: 'same_client_only',
    permissions: ['patient_care', 'medical_records', 'prescriptions', 'appointments'],
  },
  [CoreRole.OFFICE_STAFF]: {
    level: 3,
    description: 'Administrative staff including reception, billing, and coordination',
    canCreate: [CoreRole.PATIENT],
    canManage: 'same_client_only',
    permissions: ['appointments', 'billing', 'basic_reports', 'patient_registration'],
  },
  [CoreRole.PATIENT]: {
    level: 1,
    description: 'Healthcare service recipient with patient portal access',
    canCreate: [],
    canManage: 'self_only',
    permissions: ['patient_portal', 'view_own_records', 'appointments'],
  },
  [CoreRole.NA]: {
    level: -1,
    description: 'Healthcare service recipient with no access',
    canCreate: [],
    canManage: 'self_only',
    permissions: [],
  },
};

/**
 * Type for role hierarchy values
 */
export type RoleHierarchy = typeof ROLE_HIERARCHY;

/**
 * Helper functions for role management
 */
export const RoleUtils = {
  /**
   * Check if a role can create another role
   */
  canCreateRole: (assignerRole: CoreRole, targetRole: CoreRole): boolean => {
    return ROLE_HIERARCHY[assignerRole].canCreate.includes(targetRole);
  },

  /**
   * Get role level for comparison
   */
  getRoleLevel: (role: CoreRole): number => {
    return ROLE_HIERARCHY[role].level;
  },

  /**
   * Check if role has higher or equal level
   */
  hasHigherOrEqualLevel: (assignerRole: CoreRole, targetRole: CoreRole): boolean => {
    return ROLE_HIERARCHY[assignerRole].level >= ROLE_HIERARCHY[targetRole].level;
  },

  /**
   * Get all roles that a role can create
   */
  getCreatableRoles: (role: CoreRole): CoreRole[] => {
    return [...ROLE_HIERARCHY[role].canCreate];
  },

  /**
   * Check if role can manage across clients
   */
  canManageAllClients: (role: CoreRole): boolean => {
    return ROLE_HIERARCHY[role].canManage === 'all_clients';
  },

  /**
   * Get role permissions
   */
  getRolePermissions: (role: CoreRole): string[] => {
    return [...ROLE_HIERARCHY[role].permissions];
  },
};
