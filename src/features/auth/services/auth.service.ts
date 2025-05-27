import { userRepository } from '../repositories/user.repository';
import { tokenService } from './token.service';
import { Role } from '../models/user.model';
import { LoginRequestDto, RegisterRequestDto } from '../dto/auth.dto';
import { ENV } from '../../../config/env';

/**
 * Handle user login
 */
export const login = async (loginDto: LoginRequestDto) => {
  const user = await userRepository.findByUsername(loginDto.username);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Simple password check (no hashing)
  const isPasswordValid = user.password === loginDto.password;

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user);

  // Calculate expiration times
  const accessTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.accessTokenExpiresIn);
  const refreshTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.refreshTokenExpiresIn);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: accessTokenExpiresIn,
    refreshTokenExpiresIn,
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

/**
 * Register a new user
 */
export const register = async (registerDto: RegisterRequestDto) => {
  const existingUser = await userRepository.findByUsername(registerDto.username);

  console.log('Register DTO:', registerDto);

  if (existingUser) {
    throw new Error('User already exists');
  }

  // No password hashing
  const plainTextPassword = registerDto.password;

  // Check if the provided role is valid
  let userRole = Role.PATIENT; // Default role

  if (registerDto.role) {
    // Optional: validate that the role is valid
    const isValidRole = Object.values(Role).includes(registerDto.role as Role);
    if (isValidRole) {
      userRole = registerDto.role as Role;
    } else {
      throw new Error('Invalid role specified');
    }
  }

  const newUser = await userRepository.create({
    username: registerDto.username,
    password: plainTextPassword, // Store plain text password
    firstName: registerDto.firstName,
    lastName: registerDto.lastName,
    role: userRole,
  });

  const accessToken = tokenService.generateAccessToken(newUser);
  const refreshToken = tokenService.generateRefreshToken(newUser);

  // Calculate expiration times
  const accessTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.accessTokenExpiresIn);
  const refreshTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.refreshTokenExpiresIn);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: accessTokenExpiresIn,
    refreshTokenExpiresIn,
    user: {
      id: newUser.id,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    },
  };
};

/**
 * Refresh a user's access token using a refresh token
 */
export const refreshToken = async (refreshToken: string) => {
  // Verify the refresh token
  const decoded = tokenService.verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw new Error('Invalid refresh token');
  }

  // Check if the token exists in our storage
  const storedToken = tokenService.findRefreshToken(decoded.jti);

  if (!storedToken) {
    // Token not found - possible token reuse attack
    // Revoke all tokens for this user and family as a precaution
    tokenService.revokeAllUserTokens(decoded.userId);
    tokenService.revokeTokenFamily(decoded.family);
    throw new Error('Invalid refresh token');
  }

  // Get the user
  const user = await userRepository.findById(decoded.userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Revoke the used refresh token
  tokenService.revokeRefreshToken(decoded.jti);

  // Generate new tokens - passing the family ensures we can track the lineage
  const newAccessToken = tokenService.generateAccessToken(user);
  const newRefreshToken = tokenService.generateRefreshToken(user, decoded.family);

  // Calculate expiration times
  const accessTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.accessTokenExpiresIn);
  const refreshTokenExpiresIn = tokenService.calculateExpiresIn(ENV.jwt.refreshTokenExpiresIn);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: accessTokenExpiresIn,
    refreshTokenExpiresIn,
  };
};

/**
 * Logout a user by revoking their refresh token
 */
export const logout = async (token: string) => {
  const decoded = tokenService.verifyRefreshToken(token);

  if (!decoded) {
    // No need to throw - if token is invalid, it's already "logged out"
    return;
  }

  // Revoke this token
  tokenService.revokeRefreshToken(decoded.jti);

  // Optionally, revoke all tokens in this family for complete logout
  tokenService.revokeTokenFamily(decoded.family);
};

// Export as a group for convenience
export const authService = {
  login,
  register,
  refreshToken,
  logout,
};
