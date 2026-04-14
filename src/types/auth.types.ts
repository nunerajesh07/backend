export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  STUDENT = 'STUDENT'
}

export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  MANAGE_MODERATORS = 'MANAGE_MODERATORS'
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500
}

export interface IUser {
  _id: string;
  name?: string;
  email: string;
  role: UserRole;
  campus?: string | null;
  createdAt: Date;
}

export interface ITokenPayload {
  userId: string;
  role: UserRole;
  campus?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}

