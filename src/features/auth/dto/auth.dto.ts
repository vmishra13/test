import type { Role } from '../models/user.model';

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface RegisterRequestDto {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}
