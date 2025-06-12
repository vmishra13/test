import type { AuthenticatedUser } from '@/features/auth/middlewares';

//TODO: RENAME USERRETRIVALACTION TO USERMANAGEMENTACTION
// Define possible user registration actions

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

export enum UserRegistrationAction {
  ADD_CLIENT_ADMIN = 'addClientAdmin',
  ADD_CLINICAL_STAFF = 'addClinicalStaff',
  ADD_OFFICE_STAFF = 'addOfficeStaff',
  ADD_PATIENT = 'addPatient',
}

// Extend Express Request interface for user registration
// export interface ExtendedRequest extends Request {
//   user: AuthenticatedUser;
//   // action?: UserRegistrationAction;
// }

export interface ExtendedRequest<TQuery = any, TBody = any>
  extends Omit<Request, 'body' | 'query'> {
  user: AuthenticatedUser;
  query: TQuery;
  body: TBody;
}

// Define possible user retrieval actions
export enum UserRetrievalAction {
  VIEW_ALL_USERS = 'viewAllUsers', // SUPER_ADMIN
  VIEW_CLIENT_USERS = 'viewClientUsers', // CLIENT_ADMIN
  VIEW_CLIENT_PATIENTS = 'viewClientPatients', // CLINICAL_STAFF, OFFICE_STAFF
}

// Extend Express Request interface for user retrieval
// export interface ExtendedGetUsersRequest extends Request {
//   user: AuthenticatedUser;
//   action?: UserRetrievalAction;
//   query: {
//     clientId?: string;
//     role?: string;
//     status?: string;
//     page?: string;
//     limit?: string;
//     search?: string;
//   };
// }

export interface AuthorizationContext {
  reqUserId: number;
  reqClientId: number;
  reqUserTypeId: number;
  reqUserRoles: string[];
  actionUserId: number | null;
  actionClientId: number | null;
  actionPermission: RequestUserAction;
  actionUserTypeId: number | null;
}

export interface ExtendedGetUsersRequest extends Request {
  reqUserId: number;
  reqClietID: number;
  reqUserTypeId: number;
  reqUserRoles: string[];
  actionUserId: number;
  actionClientID: number;
  actionPermission: RequestUserAction;
  actionUserTypeId: number;
}

export interface UserQuery {
  clientId?: string;
  role?: string;
  status?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface UserAction {
  actionUserId: number | null;
  actionClientId: number | null;
  actionUserTypeId: number | null;
  actionPermission: RequestUserAction;
}

// reqUserId = req.user.userId;
// actionClientID = req.body.clientId;
// actionPermission ="userAdd";
