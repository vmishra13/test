import type { CoreRole } from '../../../shared/constants';

export enum RequestUserAction {
  clAdd = 'clAdd', // Add a new user
  clEdit = 'clEdit', // Edit an existing user
  clView = 'clView', // View user details
  clDelete = 'clDelete', // Delete a user
  userAdd = 'userAdd', // Add a new user
  userEdit = 'userEdit', // Edit an existing user
  userView = 'userView', // View user details
  userDelete = 'userDelete', // Delete a user
}

export interface AuthRequest {
  reqUserId: number;
  reqClientId: number;
  reqUserTypeId: number;
  reqUserRoles: CoreRole[];
  actionUserId: number | null;
  actionClientId: number | null;
  actionUserTypeId: number | null;
  actionUserRoles: CoreRole[] | CoreRole | null;
  actionPermission: RequestUserAction;
}

export interface UserQuery {
  clientId?: number;
  role?: CoreRole;
  status?: number;
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'asc' | 'desc';
}
